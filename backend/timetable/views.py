# timetable/views.py

import re
import pandas as pd
from io import BytesIO
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Timetable, Session
from .serializers import TimetableSerializer, TimetableListSerializer, SessionSerializer


# ─────────────────────────────────────────────────────────────
# TIMETABLE PARSER
#
# The Zetech campus timetable Excel has NO column headers.
# Its structure is a series of programme blocks, e.g.:
#
#   Row N:     "BBAM Y1S1"          ← programme header
#   Row N+1:   "" | 0800-1100 | 1100-1400 | 1400-1700   ← time labels (skip)
#   Row N+2..6: Monday … Friday     ← day rows, cols 1-4 = jammed session cells
#
# Each session cell packs 4 things: "LecName UNIT_CODE Unit Title RoomCode"
# e.g. "PHINEAS MUTWIRI BAC 111 financial accounting 1 A103"
#
# Programme formats seen in the wild:
#   BBAM Y1S1  /  BBAM Y3S1 ACCOUNTING  (degree — YxSx)
#   DAC SEM1   /  DHM SEM3              (diploma — SEMx)
#   CBM MOD 1 TERM 2                    (certificate — MOD x TERM x)
#   ICDL                                (short course — no suffix)
# ─────────────────────────────────────────────────────────────

# Time slots by column index (1-based in the row)
TIME_SLOTS = {
    1: ('08:00', '11:00'),
    2: ('11:00', '14:00'),
    3: ('14:00', '17:00'),
    4: ('17:30', '20:30'),   # evening slot — column 4
}

# Unit code: 2-5 uppercase letters, optional space, 2-3 digits
# Handles: BAC 111, BHR312, BIRD 122, BSCIT 101
UNIT_CODE_RE = re.compile(r'\b([A-Z]{2,5})\s*(\d{2,3})\b', re.IGNORECASE)

# Room: A### or L### — e.g. A103, L209, L006, A002
ROOM_RE = re.compile(r'\b([AL]\d+[A-Z]?)\b', re.IGNORECASE)

# Programme code: leading uppercase word(s) before Y/SEM/MOD/ICDL
PROG_CODE_RE = re.compile(r'^([A-Z]+(?:\s[A-Z]+)?)', re.IGNORECASE)

DAYS = {'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'}


def normalize_day(raw):
    d = str(raw).strip().lower()
    if 'mon' in d: return 'Monday'
    if 'tue' in d: return 'Tuesday'
    if 'wed' in d: return 'Wednesday'
    if 'thu' in d: return 'Thursday'
    if 'fri' in d: return 'Friday'
    if 'sat' in d: return 'Saturday'
    if 'sun' in d: return 'Sunday'
    return None


def _is_programme_header(val):
    """
    True if the cell is the start of a new programme block.
    Must start with a letter, must NOT be a day name or time label.
    """
    val = str(val).strip()
    if not val or val.lower() in ('nan', ''):
        return False
    # time-slot header rows
    if re.match(r'^\d{4}', val):
        return False
    # campus title row
    if 'RUIRU' in val.upper() or 'THIKA' in val.upper() or 'CAMPUS' in val.upper():
        return False
    # day names
    if normalize_day(val) is not None:
        return False
    # must start with capital letter (programme code)
    return bool(re.match(r'^[A-Z]', val))


def _extract_programme_code(header):
    """Extract short code from header, e.g. 'BBAM Y1S1' → 'BBAM', 'CJMS ZU Y1S1' → 'CJMS ZU'."""
    # Remove trailing year/semester suffix
    cleaned = re.sub(r'\s+Y\d+S\d+.*$', '', header, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+(SEM|MOD|TERM)\s*\d.*$', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    return cleaned or header.split()[0]


def parse_cell(cell_content, day, slot_index, programme, row_number, errors):
    """
    Extract one session from a jammed cell like:
        "PHINEAS MUTWIRI BAC 111 financial accounting 1 A103"
        "FLORA MWANJA BCU 111 Communication Skills ONLINE"
        "DR. ERIC IRUNGU BIRD 122 Theories of International Relations ONLINE"
    """
    content = str(cell_content).strip()
    if not content or content.lower() in ('nan', 'none', ''):
        return None

    start_time, end_time = TIME_SLOTS.get(slot_index, ('00:00', '00:00'))
    is_online = bool(re.search(r'\bONLINE\b', content, re.IGNORECASE))
    is_self_paced = bool(re.search(r'\bSELF\s*PACED\b', content, re.IGNORECASE))

    # ── Extract room ──────────────────────────────────────
    if is_online or is_self_paced:
        room = 'ONLINE'
        content_clean = re.sub(r'\b(ONLINE|SELF\s*PACED(\s*LEARNING)?)\b', '', content, flags=re.IGNORECASE).strip()
    else:
        room_matches = list(ROOM_RE.finditer(content))
        if room_matches:
            last = room_matches[-1]
            room = last.group(1).upper()
            content_clean = content[:last.start()].strip()
        else:
            room = 'TBA'
            content_clean = content

    # ── Extract unit code ─────────────────────────────────
    unit_match = UNIT_CODE_RE.search(content_clean)
    if not unit_match:
        errors.append({
            'row':       row_number,
            'programme': programme,
            'content':   content[:70],
            'message':   'Could not extract unit code — row skipped',
        })
        return None

    unit_code  = f"{unit_match.group(1).upper()} {unit_match.group(2)}"
    lec_name   = content_clean[:unit_match.start()].strip() or 'Staff'
    unit_title = content_clean[unit_match.end():].strip() or 'N/A'

    # Clean common noise from lecturer name
    lec_name = re.sub(r'^(DR\.?|PROF\.?)\s+', lambda m: m.group(0), lec_name, flags=re.IGNORECASE)

    return {
        'programme':      programme,
        'programme_code': _extract_programme_code(programme),
        'unit_code':      unit_code,
        'unit_title':     unit_title,
        'lec_name':       lec_name,
        'day':            day,
        'start_time':     start_time,
        'end_time':       end_time,
        'room':           room,
    }


def parse_timetable_file(file_obj):
    """
    Parse the Zetech campus Excel timetable.

    Reads the file with header=None (no column headers exist).
    Iterates every row and looks for programme block headers to
    establish context, then parses day rows within each block.

    Returns: { sessions, errors, stats, programmes }
    """
    file_bytes = BytesIO(file_obj.read())
    name = file_obj.name.lower()

    try:
        if name.endswith('.csv'):
            df = pd.read_csv(file_bytes, header=None, dtype=str)
        else:
            # header=None is critical — the file has NO column header row.
            # The old code used header=0 which consumed "BBAM Y1S1" as column names.
            df = pd.read_excel(file_bytes, sheet_name=0, header=None, dtype=str, engine='openpyxl')
    except Exception as e:
        raise ValueError(f'Failed to read file: {str(e)}')

    df = df.fillna('')

    sessions       = []
    errors         = []
    current_prog   = None
    programme_set  = []   # ordered list, no set (preserve order)
    seen_progs     = set()

    for i, row in df.iterrows():
        vals = list(row)
        col0 = str(vals[0]).strip()

        # ── Programme block header ────────────────────────────
        if _is_programme_header(col0):
            current_prog = col0
            if current_prog not in seen_progs:
                programme_set.append(current_prog)
                seen_progs.add(current_prog)
            continue

        if not current_prog:
            continue

        # ── Day row ───────────────────────────────────────────
        day = normalize_day(col0)
        if day is None:
            continue  # time-header row or blank — skip

        # Columns 1, 2, 3, 4 map to time slots
        for slot_idx in [1, 2, 3, 4]:
            if slot_idx >= len(vals):
                break
            cell = str(vals[slot_idx]).strip()
            if not cell or cell.lower() in ('nan', 'none', ''):
                continue
            parsed = parse_cell(cell, day, slot_idx, current_prog, i + 1, errors)
            if parsed:
                sessions.append(parsed)

    unique_units = list({s['unit_code'] for s in sessions})
    lecturers    = list({s['lec_name']  for s in sessions if s['lec_name'] not in ('Staff', '')})
    rooms        = list({s['room']      for s in sessions if s['room'] not in ('ONLINE', 'TBA')})
    prog_codes   = list({s['programme_code'] for s in sessions})

    return {
        'sessions':   sessions,
        'errors':     errors,
        'programmes': programme_set,
        'stats': {
            'totalRows':       len(df),
            'parsedSessions':  len(sessions),
            'errorCount':      len(errors),
            'programmeCount':  len(programme_set),
            'uniqueUnits':     unique_units,
            'uniqueUnitCount': len(unique_units),
            'lecturers':       lecturers,
            'lecturerCount':   len(lecturers),
            'rooms':           rooms,
            'roomCount':       len(rooms),
            'programmeCodes':  prog_codes,
        }
    }


# ─────────────────────────────────────────────────────────────
# VIEWS
# ─────────────────────────────────────────────────────────────

class TimetableViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['school', 'academic_year', 'semester', 'campus', 'status']

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Timetable.objects.all()
        return Timetable.objects.filter(status='published')

    def get_serializer_class(self):
        if self.action == 'list':
            return TimetableListSerializer
        return TimetableSerializer

    @action(detail=False, methods=['get'], url_path='sessions')
    def sessions(self, request):
        """
        GET /api/timetable/timetables/sessions/
        Returns all sessions for the most recent published timetable
        matching the given campus + academicYear + semester filters.
        """
        campus        = request.query_params.get('campus', '').strip()
        academic_year = request.query_params.get('academicYear', '').strip()
        semester      = request.query_params.get('semester', '').strip()

        qs = Timetable.objects.filter(status='published')
        if campus:        qs = qs.filter(campus__iexact=campus)
        if academic_year: qs = qs.filter(academic_year=academic_year)
        if semester:      qs = qs.filter(semester=semester)

        timetable = qs.order_by('-created_at').first()
        if not timetable:
            return Response({'success': True, 'sessions': [], 'programmes': []})

        session_qs = timetable.sessions.all()
        sessions   = SessionSerializer(session_qs, many=True).data
        programmes = list(
            session_qs.values_list('programme', flat=True)
            .distinct().order_by('programme')
        )

        return Response({
            'success':    True,
            'sessions':   sessions,
            'programmes': programmes,
            'data': {
                'id':           timetable.id,
                'campus':       timetable.campus,
                'academicYear': timetable.academic_year,
                'semester':     timetable.semester,
                'stats': {
                    'totalSessions': session_qs.count(),
                    'uniqueUnits':   timetable.metadata.get('uniqueUnitCount', 0),
                    'lecturers':     timetable.metadata.get('lecturerCount', 0),
                    'rooms':         timetable.metadata.get('roomCount', 0),
                    'programmes':    timetable.metadata.get('programmeCount', 0),
                },
            },
        })

    @action(detail=False, methods=['get'], url_path='search-sessions')
    def search_sessions(self, request):
        unit_code      = request.query_params.get('unit_code')
        lec_name       = request.query_params.get('lec_name')
        room           = request.query_params.get('room')
        programme      = request.query_params.get('programme')
        programme_code = request.query_params.get('programme_code')

        qs = Session.objects.filter(
            timetable__status='published'
        ).select_related('timetable')

        if unit_code:       qs = qs.filter(unit_code__iexact=unit_code)
        if lec_name:        qs = qs.filter(lec_name__icontains=lec_name)
        if room:            qs = qs.filter(room__iexact=room)
        if programme:       qs = qs.filter(programme__icontains=programme)
        if programme_code:  qs = qs.filter(programme_code__iexact=programme_code)

        data = [{
            'unitCode':     s.unit_code,
            'unitTitle':    s.unit_title,
            'lecName':      s.lec_name,
            'day':          s.day,
            'startTime':    s.start_time,
            'endTime':      s.end_time,
            'room':         s.room,
            'programme':    s.programme,
            'school':       s.timetable.school_name,
            'academicYear': s.timetable.academic_year,
            'semester':     s.timetable.semester,
            'campus':       s.timetable.campus,
        } for s in qs[:20]]

        return Response({'success': True, 'data': data})

    @action(detail=False, methods=['get'], url_path='availability')
    def availability(self, request):
        timetables = Timetable.objects.filter(status='published')
        data = [{
            'school':       t.school_name,
            'academicYear': t.academic_year,
            'semester':     t.semester,
            'campus':       t.campus,
            'totalSessions':t.metadata.get('totalSessions', 0),
            'uniqueUnits':  t.metadata.get('uniqueUnitCount', 0),
            'programmes':   t.metadata.get('programmes', []),
        } for t in timetables]

        return Response({
            'success':  True,
            'available':timetables.exists(),
            'data':     data,
            'schools':  list(timetables.values_list('school_name', flat=True).distinct()),
        })


class TimetableUploadView(APIView):
    """
    POST /api/timetable/upload/
    Accepts the Zetech campus Excel timetable format.
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        # ── Validate inputs ───────────────────────────────────
        file_obj = request.FILES.get('timetable')
        if not file_obj:
            return Response(
                {'success': False, 'message': 'No timetable file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        school        = request.data.get('school',       '').strip()
        school_name   = request.data.get('schoolName',   '').strip()
        academic_year = request.data.get('academicYear', '').strip()
        semester      = request.data.get('semester',     '').strip()
        campus        = request.data.get('campus',       '').strip()
        notes         = request.data.get('notes',        '').strip()
        uploaded_by   = request.data.get('uploadedBy',   'admin').strip()

        if not all([school, academic_year, semester]):
            return Response(
                {'success': False, 'message': 'school, academicYear, and semester are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Parse ─────────────────────────────────────────────
        try:
            result = parse_timetable_file(file_obj)
        except ValueError as e:
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        sessions_data = result['sessions']
        errors        = result['errors']
        stats         = result['stats']

        if not sessions_data:
            return Response({
                'success':     False,
                'message':     'No valid sessions found in the file',
                'parseReport': {'errors': errors},
            }, status=status.HTTP_400_BAD_REQUEST)

        # ── Build metadata ────────────────────────────────────
        metadata = {
            'totalSessions':  len(sessions_data),
            'uniqueUnits':    stats['uniqueUnits'],
            'uniqueUnitCount':stats['uniqueUnitCount'],
            'lecturers':      stats['lecturers'],
            'lecturerCount':  stats['lecturerCount'],
            'rooms':          stats['rooms'],
            'roomCount':      stats['roomCount'],
            'programmes':     result['programmes'],
            'programmeCount': stats['programmeCount'],
            'programmeCodes': stats['programmeCodes'],
            'campus':         campus,
            'parsedRows':     stats['totalRows'],
            'errorRows':      len(errors),
        }

        # ── Save Timetable + Sessions ─────────────────────────
        timetable = Timetable.objects.create(
            school        = school,
            school_name   = school_name or school,
            academic_year = academic_year,
            semester      = semester,
            campus        = campus,
            file_name     = file_obj.name,
            file_size     = file_obj.size,
            notes         = notes,
            status        = 'published',
            uploaded_by   = uploaded_by,
            metadata      = metadata,
        )

        Session.objects.bulk_create([
            Session(timetable=timetable, **s)
            for s in sessions_data
        ])

        return Response({
            'success': True,
            'message': f'Timetable published — {len(sessions_data)} sessions across {stats["programmeCount"]} programme groups.',
            'data': {
                'id':           timetable.id,
                'school':       timetable.school,
                'schoolName':   timetable.school_name,
                'academicYear': timetable.academic_year,
                'semester':     timetable.semester,
                'campus':       campus,
                'stats': {
                    'totalSessions':  len(sessions_data),
                    'uniqueUnits':    stats['uniqueUnitCount'],
                    'lecturers':      stats['lecturerCount'],
                    'rooms':          stats['roomCount'],
                    'programmes':     stats['programmeCount'],
                    'errors':         len(errors),
                },
                'programmes': result['programmes'],
            },
            # Full sessions array returned so the admin UI can render
            # the parsed data tab without a second API call.
            'sessions':    sessions_data,
            'parseReport': {'errors': errors},
        }, status=status.HTTP_201_CREATED)