# timetable/views.py — full corrected file

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
# Python port of your timetableParser.js
# Handles the "jammed cell" Excel format where each cell
# contains: "LecturerName UNIT_CODE Unit Title RoomCode"
# ─────────────────────────────────────────────────────────────

# Fixed time slots by column position — mirrors getTimeSlotByIndex()
TIME_SLOTS = {
    1: ('08:00', '11:00'),
    2: ('11:00', '14:00'),
    3: ('14:00', '17:00'),
}

# Unit code pattern: 2-3 letters + space + 2-3 digits
# e.g. BAC 111, ICT 101, HE 201
UNIT_CODE_RE = re.compile(r'\b([A-Z]{2,3})\s+(\d{2,3})\b', re.IGNORECASE)

# Room pattern: A or L followed by digits e.g. A103, L205
ROOM_RE = re.compile(r'\b([AL]\d+)\b', re.IGNORECASE)


def normalize_day(raw):
    """
    Mirrors your normalizeDay() JS method.
    Handles abbreviations like Mon, Tue, Wed etc.
    """
    d = str(raw).strip().lower()
    if 'mon' in d: return 'Monday'
    if 'tue' in d: return 'Tuesday'
    if 'wed' in d: return 'Wednesday'
    if 'thu' in d: return 'Thursday'
    if 'fri' in d: return 'Friday'
    if 'sat' in d: return 'Saturday'
    if 'sun' in d: return 'Sunday'
    return str(raw).strip().capitalize()


def parse_jammed_cell(cell_content, day, slot_index, row_number, errors):
    """
    Mirrors your parseJammedCell() JS method.

    Extracts from a single cell string like:
    "Dr. Kamau BAC 111 Financial Accounting L203"

    Returns a session dict or None if parsing fails.

    The extraction order matters:
    1. Find room (last A/L room code in string)
    2. Strip room from string
    3. Find unit code
    4. Everything before unit code = lecturer name
    5. Everything after unit code = unit title
    """
    content = str(cell_content).strip()
    if not content:
        return None

    start_time, end_time = TIME_SLOTS[slot_index]
    is_online = 'ONLINE' in content.upper()

    # ── Extract room ──────────────────────────────────────────
    if is_online:
        room = 'ONLINE'
        # Remove the word ONLINE from content before further parsing
        content_no_room = re.sub(r'ONLINE', '', content, flags=re.IGNORECASE).strip()
    else:
        # Find the LAST room code in the string
        # (mirrors: /\b([AL]\d+)\b(?!.*\b[AL]\d+\b)/i in JS)
        room_matches = list(ROOM_RE.finditer(content))
        if room_matches:
            last_match = room_matches[-1]
            room = last_match.group(1).upper()
            # Strip everything from the room code onwards
            content_no_room = content[:last_match.start()].strip()
        else:
            errors.append({
                'row': row_number,
                'content': content[:50],
                'message': 'No valid room found (expected A### or L###), treating as ONLINE'
            })
            room = 'ONLINE'
            content_no_room = content

    # ── Extract unit code ─────────────────────────────────────
    unit_match = UNIT_CODE_RE.search(content_no_room)
    if not unit_match:
        errors.append({
            'row': row_number,
            'content': content[:50],
            'message': 'Could not extract unit code'
        })
        return None

    unit_code = f"{unit_match.group(1).upper()} {unit_match.group(2)}"
    code_start = unit_match.start()
    code_end = unit_match.end()

    # ── Extract lecturer and title from positions ─────────────
    # Everything BEFORE unit code = lecturer name
    # Everything AFTER unit code = unit title
    lec_name = content_no_room[:code_start].strip() or 'Staff'
    unit_title = content_no_room[code_end:].strip() or 'N/A'

    return {
        'unit_code': unit_code,
        'unit_title': unit_title,
        'lec_name': lec_name,
        'day': day,
        'start_time': start_time,
        'end_time': end_time,
        'room': room,
    }


def parse_timetable_file(file_obj):
    """
    Mirrors your parseFile() method.

    Reads the Excel file and iterates every row.
    Column 0 = day
    Columns 1, 2, 3 = jammed cells for each time slot.

    Returns:
        sessions   → list of valid session dicts
        errors     → list of row-level parsing errors
        stats      → summary counts
    """
    errors = []
    sessions = []

    # Read file bytes
    file_bytes = BytesIO(file_obj.read())
    name = file_obj.name.lower()

    try:
        if name.endswith('.csv'):
            # For CSV: read without header since structure is positional
            df = pd.read_csv(file_bytes, header=0, dtype=str)
        else:
            # For Excel: read first sheet, no type conversion
            # header=0 means first row is column names
            # dtype=str keeps everything as string — avoids pandas
            # converting "BAC 111" to float NaN
            df = pd.read_excel(
                file_bytes,
                sheet_name=0,       # first sheet only, mirrors workbook.SheetNames[0]
                header=0,
                dtype=str,
                engine='openpyxl'
            )
    except Exception as e:
        raise ValueError(f'Failed to read file: {str(e)}')

    # Fill NaN with empty string — mirrors defval: "" in xlsx.utils.sheet_to_json
    df = df.fillna('')

    total_rows = len(df)

    for idx, row in df.iterrows():
        row_number = idx + 2  # +2: idx is 0-based, row 1 is header

        # Get values by position, not by column name
        # This mirrors: const values = Object.values(row)
        values = row.tolist()

        if len(values) < 1:
            continue

        # Column 0 = day
        day_raw = str(values[0]).strip()
        if not day_raw or day_raw.lower() in ('', 'nan', 'none'):
            continue  # empty row, skip silently

        day = normalize_day(day_raw)

        # Columns 1, 2, 3 = time slot cells
        # Mirrors: for (let index = 1; index <= 3; index++)
        for slot_index in [1, 2, 3]:
            if slot_index >= len(values):
                break

            cell = str(values[slot_index]).strip()
            if not cell or cell.lower() in ('nan', 'none', ''):
                continue  # empty slot, skip

            parsed = parse_jammed_cell(cell, day, slot_index, row_number, errors)
            if parsed:
                sessions.append(parsed)

    return {
        'sessions': sessions,
        'errors': errors,
        'stats': {
            'totalRows': total_rows,
            'parsedSessions': len(sessions),
            'errorCount': len(errors),
        }
    }


# ─────────────────────────────────────────────────────────────
# VIEWS
# ─────────────────────────────────────────────────────────────

class TimetableViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['school', 'academic_year', 'semester', 'status']

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Timetable.objects.all()
        return Timetable.objects.filter(status='published')

    def get_serializer_class(self):
        if self.action == 'list':
            return TimetableListSerializer
        return TimetableSerializer

    @action(detail=False, methods=['get'], url_path='search-sessions')
    def search_sessions(self, request):
        unit_code = request.query_params.get('unit_code')
        lec_name = request.query_params.get('lec_name')
        room = request.query_params.get('room')

        qs = Session.objects.filter(
            timetable__status='published'
        ).select_related('timetable')

        if unit_code:
            qs = qs.filter(unit_code__iexact=unit_code)
        if lec_name:
            qs = qs.filter(lec_name__icontains=lec_name)
        if room:
            qs = qs.filter(room__iexact=room)

        sessions = qs[:10]
        data = [{
            'unitCode': s.unit_code,
            'unitTitle': s.unit_title,
            'lecName': s.lec_name,
            'day': s.day,
            'startTime': s.start_time,
            'endTime': s.end_time,
            'room': s.room,
            'school': s.timetable.school_name,
            'academicYear': s.timetable.academic_year,
            'semester': s.timetable.semester,
        } for s in sessions]

        return Response({'success': True, 'data': data})

    @action(detail=False, methods=['get'], url_path='availability')
    def availability(self, request):
        timetables = Timetable.objects.filter(status='published')
        data = [{
            'school': t.school_name,
            'academicYear': t.academic_year,
            'semester': t.semester,
            'totalSessions': t.metadata.get('totalSessions', 0),
            'uniqueUnits': len(t.metadata.get('uniqueUnits', [])),
        } for t in timetables]

        return Response({
            'success': True,
            'available': timetables.exists(),
            'data': data,
            'schools': list(
                timetables.values_list('school_name', flat=True).distinct()
            )
        })


class TimetableUploadView(APIView):
    """
    POST /api/timetable/upload/
    Accepts Excel/CSV, parses jammed cells, saves Timetable + Sessions.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        # ── 1. Validate inputs ────────────────────────────────
        file_obj = request.FILES.get('timetable')
        if not file_obj:
            return Response(
                {'success': False, 'message': 'No timetable file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        school = request.data.get('school', '').strip()
        school_name = request.data.get('schoolName', '').strip()
        academic_year = request.data.get('academicYear', '').strip()
        semester = request.data.get('semester', '').strip()
        notes = request.data.get('notes', '').strip()
        uploaded_by = request.data.get('uploadedBy', 'admin').strip()

        if not all([school, academic_year, semester]):
            return Response(
                {'success': False, 'message': 'school, academicYear, and semester are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── 2. Parse the file using the parser above ──────────
        try:
            result = parse_timetable_file(file_obj)
        except ValueError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        sessions_data = result['sessions']
        errors = result['errors']
        warnings = []

        if not sessions_data:
            return Response({
                'success': False,
                'message': 'No valid sessions found in the file',
                'parseReport': {'errors': errors, 'warnings': warnings}
            }, status=status.HTTP_400_BAD_REQUEST)

        # ── 3. Build metadata ─────────────────────────────────
        unique_units = list({s['unit_code'] for s in sessions_data})
        lecturers = list({s['lec_name'] for s in sessions_data if s['lec_name'] != 'Staff'})
        rooms = list({s['room'] for s in sessions_data if s['room'] != 'ONLINE'})

        metadata = {
            'totalSessions': len(sessions_data),
            'uniqueUnits': unique_units,
            'lecturers': lecturers,
            'rooms': rooms,
            'parsedRows': result['stats']['totalRows'],
            'errorRows': len(errors),
            'warnings': warnings,
        }

        # ── 4. Save Timetable + Sessions ──────────────────────
        timetable = Timetable.objects.create(
            school=school,
            school_name=school_name or school,
            academic_year=academic_year,
            semester=semester,
            file_name=file_obj.name,
            file_size=file_obj.size,
            notes=notes,
            status='published',
            uploaded_by=uploaded_by,
            metadata=metadata,
        )

        Session.objects.bulk_create([
            Session(timetable=timetable, **s)
            for s in sessions_data
        ])

        # ── 5. Return response ────────────────────────────────
        return Response({
            'success': True,
            'message': 'Timetable uploaded and published successfully',
            'data': {
                'id': timetable.id,
                'school': timetable.school,
                'schoolName': timetable.school_name,
                'academicYear': timetable.academic_year,
                'semester': timetable.semester,
                'stats': {
                    'totalSessions': len(sessions_data),
                    'uniqueUnits': len(unique_units),
                    'lecturers': len(lecturers),
                    'rooms': len(rooms),
                }
            },
            'parseReport': {
                'warnings': warnings,
                'errors': errors,
            }
        }, status=status.HTTP_201_CREATED)
