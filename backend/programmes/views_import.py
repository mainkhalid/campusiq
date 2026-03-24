
import re
import requests as http_requests
from rest_framework.views import APIView
from rest_framework.response import Response
from bs4 import BeautifulSoup



FEES_URL   = 'https://www.zetech.ac.ke/index.php/academics/tuition-fees'
SAJILI_URL = 'https://sajili.zetech.ac.ke/index.php?mod=programs'

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; ZetechBot/1.0)'}


SECTION_LEVEL_MAP = {
    'phd programmes':      'Doctorate',
    'master programmes':   'Masters',
    'degree courses':      'Degree',
    'diploma courses':     'Diploma',
    'certificate courses': 'Certificate',
    'tvet courses':        'Certificate',
    'doctorate':           'Doctorate',
    'masters':             'Masters',
    'degree':              'Degree',
    'diploma':             'Diploma',
    'certificate':         'Certificate',
}
SCHOOL_MAP = [
    (['computer science', 'software', 'information technology', ' it ', 'ict',
      'networks', 'media', 'digital', 'engineering', 'actuarial', 'data science',
      'applied physics', 'mathematics', 'bbit', 'bscit', 'bcs', 'bse', 'dit',
      'dse', 'dbit', 'dcs', 'cit', 'film', 'television'], 'ict'),
    (['commerce', 'business', 'finance', 'accounting', 'marketing', 'economics',
      'purchasing', 'supply chain', 'human resource', 'procurement',
      'entrepreneurship', 'hospitality', 'tourism', 'project management',
      'criminology', 'international relations', 'diplomacy'], 'business'),
    (['law', 'legal'], 'law'),
    (['health', 'nursing', 'medical', 'clinical', 'nutrition', 'public health'], 'health'),
    (['education', 'arts', 'social science', 'political', 'linguistics',
      'journalism', 'psychology', 'sociology', 'communication', 'counseling',
      'development studies'], 'education'),
]


def infer_school(name: str) -> str:
    name_lower = name.lower()
    for keywords, school in SCHOOL_MAP:
        if any(kw in name_lower for kw in keywords):
            return school
    return 'ict'


def extract_code(name: str) -> str:
    """'Bachelor of Commerce (BCom)' -> 'BCom'"""
    match = re.search(r'\(([A-Z][A-Za-z0-9.]+)\)', name)
    return match.group(1) if match else ''


def clean_fee(fee_str: str) -> int:
    """'54,650/-' -> 54650"""
    cleaned = re.sub(r'[^0-9]', '', str(fee_str))
    return int(cleaned) if cleaned else 0


def normalize_name(name: str) -> str:
    """Normalize name for matching — uppercase, strip code in parens, collapse spaces."""
    name = re.sub(r'\s*\([^)]+\)\s*', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip().upper()
    return name

def scrape_fees_page() -> dict:
    """
    Scrape tuition-fees page.
    Returns dict keyed by normalized programme name with fee data.
    """
    resp = http_requests.get(FEES_URL, timeout=15, headers=HEADERS)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'html.parser')
    result = {}
    current_level = 'Degree'

    content_area = soup.find('div', class_='item-page') or soup.find('main') or soup.body

    for element in content_area.find_all(['h3', 'h4', 'table']):
        if element.name in ['h3', 'h4']:
            heading = element.get_text(strip=True).lower()
            for key, level in SECTION_LEVEL_MAP.items():
                if key in heading:
                    current_level = level
                    break
            continue

        # Skip TVET tables (fee per term not semester)
        header_text = element.get_text().lower()
        if 'term' in header_text and 'semester' not in header_text:
            continue

        for row in element.find_all('tr'):
            cells = [td.get_text(strip=True) for td in row.find_all('td')]
            if len(cells) < 2:
                continue

            name = cells[0].strip()
            if not name or name.upper() in ['PROGRAMME NAME', 'COURSE', 'ITEM']:
                continue
            if any(s in name for s in ['Application Fee', 'Caution', 'Registration',
                                        'Hostel', 'Statutory', 'Readmission',
                                        'Attachment', 'Project Fee', 'Student ID']):
                continue

            code      = extract_code(name)
            clean     = normalize_name(name)
            fee       = clean_fee(cells[1] if len(cells) > 1 else '0')
            semesters = clean_fee(cells[2] if len(cells) > 2 else '0')

            result[clean] = {
                'code':             code or None,
                'level':            current_level,
                'fee_per_semester': fee,
                'semesters':        semesters,
            }

    return result


def scrape_sajili_page() -> list[dict]:
    """
    Scrape sajili programmes page.
    Returns list of dicts with rich programme content.
    """
    resp = http_requests.get(SAJILI_URL, timeout=15, headers=HEADERS)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'html.parser')
    programmes = []
    current_level = 'Degree'

    for element in soup.find_all(['h3', 'a']):

        # Level heading e.g. <h3>Degree</h3>
        if element.name == 'h3':
            heading = element.get_text(strip=True).lower()
            for key, level in SECTION_LEVEL_MAP.items():
                if heading == key:
                    current_level = level
                    break
            continue
        href = element.get('href', '')
        if not href.startswith('#') or not href[1:].isdigit():
            continue

        prog_name = element.get_text(strip=True)
        if not prog_name or len(prog_name) < 5:
            continue

        prog_id = href[1:]
        details = soup.find(id=prog_id) or element.find_next('div')
        if not details:
            continue

        details_text = details.get_text(separator='\n', strip=True)

        # Mean grade
        mean_grade = ''
        mg_match = re.search(r'MEAN GRADE[:\s]+([A-D][+-]?)', details_text, re.IGNORECASE)
        if mg_match:
            mean_grade = mg_match.group(1).strip()

        # Campuses
        campuses = ''
        camp_match = re.search(
            r'CAMPUSES OFFERED[:\s]+(.+?)(?:\n|MODES)', details_text, re.IGNORECASE | re.DOTALL)
        if camp_match:
            campuses = re.sub(r'\s+', ' ', camp_match.group(1)).strip()

        # Modes of study
        modes = ''
        modes_match = re.search(
            r'MODES OF STUDY[:\s]+(.+?)(?:\n|PROGRAM)', details_text, re.IGNORECASE | re.DOTALL)
        if modes_match:
            modes = re.sub(r'\s+', ' ', modes_match.group(1)).strip()

        # Description
        description = ''
        desc_match = re.search(
            r'PROGRAM DESCRIPTION[:\s]*(?:Introduction\s*)?(.*?)(?:Career [Oo]pportunities|Programme Goal|Program Goal|Other Qualifications|Duration)',
            details_text, re.IGNORECASE | re.DOTALL)
        if desc_match:
            description = re.sub(r'\s+', ' ', desc_match.group(1)).strip()

        # Careers
        careers = []
        careers_match = re.search(
            r'Career [Oo]pportunities[:\s]*(.*?)(?:Programme Goal|Program Goal|Duration|Other Qualifications)',
            details_text, re.IGNORECASE | re.DOTALL)
        if careers_match:
            raw = careers_match.group(1)
            items = re.findall(r'(?:^|\n)\s*(?:\d+\.|[-*])\s*(.+)', raw)
            careers = [c.strip() for c in items if c.strip()] if items else \
                      [l.strip() for l in raw.split('\n') if l.strip() and len(l.strip()) > 3][:10]

        # Goal
        goal = ''
        goal_match = re.search(
            r'(?:Programme Goal|Program Goal|Programme Objectives)[:\s]*(.*?)(?:Duration|Other Qualifications|$)',
            details_text, re.IGNORECASE | re.DOTALL)
        if goal_match:
            goal = re.sub(r'\s+', ' ', goal_match.group(1)).strip()[:800]

        # Duration
        duration_years = None
        dur_match = re.search(r'(\d+)\s*\(?(?:calendar|academic)?\s*years?', details_text, re.IGNORECASE)
        if dur_match:
            duration_years = int(dur_match.group(1))

        # Entry requirements
        entry_requirements = ''
        entry_match = re.search(
            r'(?:Minimum Entry Requirements?|Other Qualifications|Admission Requirements?)[:\s]*(.*?)(?:Apply Now|$)',
            details_text, re.IGNORECASE | re.DOTALL)
        if entry_match:
            entry_requirements = re.sub(r'\s+', ' ', entry_match.group(1)).strip()[:600]

        programmes.append({
            'name':               normalize_name(prog_name),
            'level':              current_level,
            'school':             infer_school(prog_name),
            'description':        description,
            'goal':               goal,
            'careers':            careers,
            'mean_grade':         mean_grade,
            'campuses':           campuses,
            'modes':              modes,
            'duration_years':     duration_years,
            'entry_requirements': entry_requirements,
        })

    return programmes


# ── Merge both sources ────────────────────────────────────

def scrape_and_merge() -> list[dict]:
    """
    Scrape both pages and merge by programme name.
    Sajili = primary source (rich content)
    Fees page = financial data overlay
    """
    fees_data    = scrape_fees_page()
    sajili_progs = scrape_sajili_page()

    merged = []
    seen   = set()

    for prog in sajili_progs:
        norm_name = prog['name']
        if norm_name in seen:
            continue
        seen.add(norm_name)

        # Exact match first
        fee_info = fees_data.get(norm_name)

        # Fuzzy match by word overlap if no exact match
        if not fee_info:
            prog_words  = set(norm_name.split())
            best_match  = None
            best_score  = 0
            for fee_name, fee_val in fees_data.items():
                fee_words = set(fee_name.split())
                overlap   = len(prog_words & fee_words)
                score     = overlap / max(len(prog_words), len(fee_words))
                if score > best_score and score > 0.6:
                    best_score = score
                    best_match = fee_name
            if best_match:
                fee_info = fees_data[best_match]

        merged.append({
            'name':               norm_name,
            'code':               (fee_info or {}).get('code') or None,
            'level':              prog['level'],
            'school':             prog['school'],
            'fee_per_semester':   (fee_info or {}).get('fee_per_semester', 0),
            'semesters':          (fee_info or {}).get('semesters', 0),
            'description':        prog['description'],
            'goal':               prog['goal'],
            'careers':            prog['careers'],
            'mean_grade':         prog['mean_grade'],
            'campuses':           prog['campuses'],
            'modes':              prog['modes'],
            'duration_years':     prog['duration_years'],
            'entry_requirements': prog['entry_requirements'],
            'already_exists':     False,
        })

    # Add programmes from fees page missing in sajili
    for fee_name, fee_info in fees_data.items():
        if fee_name not in seen:
            merged.append({
                'name':               fee_name,
                'code':               fee_info.get('code') or None,
                'level':              fee_info['level'],
                'school':             infer_school(fee_name),
                'fee_per_semester':   fee_info['fee_per_semester'],
                'semesters':          fee_info['semesters'],
                'description':        '',
                'goal':               '',
                'careers':            [],
                'mean_grade':         '',
                'campuses':           '',
                'modes':              '',
                'duration_years':     None,
                'entry_requirements': '',
                'already_exists':     False,
            })

    return merged


# ── View ──────────────────────────────────────────────────

class ImportFromChunksView(APIView):
    """
    POST /api/programmes/import-from-chunks/
    action=extract  -> scrape both pages, merge, return for review
    action=confirm  -> save selected programmes to DB
    """

    def post(self, request):
        action = request.data.get('action', 'extract')
        if action == 'extract':
            return self._extract()
        elif action == 'confirm':
            return self._confirm(request)
        return Response({'error': 'Unknown action'}, status=400)

    def _extract(self):
        try:
            programmes = scrape_and_merge()

            from programmes.models import Programme
            existing_upper = {n.upper() for n in Programme.objects.values_list('name', flat=True)}
            for p in programmes:
                p['already_exists'] = p['name'].upper() in existing_upper

            return Response({
                'programmes': programmes,
                'total':      len(programmes),
                'new_count':  sum(1 for p in programmes if not p['already_exists']),
                'sources':    [FEES_URL, SAJILI_URL],
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def _confirm(self, request):
        programmes = request.data.get('programmes', [])
        if not programmes:
            return Response({'error': 'No programmes provided'}, status=400)

        from programmes.models import Programme
        saved, skipped, errors = 0, 0, []

        for p in programmes:
            try:
                name = p.get('name', '').strip()
                if not name:
                    skipped += 1
                    continue

                # Level from name — always reliable
                name_upper = name.upper()
                if 'DIPLOMA' in name_upper:
                    level = 'Diploma'
                elif 'CERTIFICATE' in name_upper:
                    level = 'Certificate'
                elif 'BACHELOR' in name_upper:
                    level = 'Degree'
                elif 'MASTER' in name_upper or 'MBA' in name_upper:
                    level = 'Masters'
                elif 'DOCTOR' in name_upper or 'PHD' in name_upper:
                    level = 'Doctorate'
                else:
                    level = p.get('level', 'Degree')

                # Drop duplicate codes rather than skip the programme
                code = p.get('code') or None
                if code and Programme.objects.filter(code=code).exists():
                    code = None

                fee       = int(p.get('fee_per_semester', 0) or 0)
                semesters = int(p.get('semesters', 0) or 0)
                duration  = round(semesters / 2) if semesters > 0 else p.get('duration_years') or None

                Programme.objects.create(
                    name               = name,
                    code               = code,
                    level              = level,
                    school             = p.get('school', 'ict').lower().strip(),
                    mean_grade         = p.get('mean_grade', ''),
                    campuses           = p.get('campuses') or 'Ruiru, Nairobi',
                    modes              = p.get('modes') or 'Full time, Part time, E-Learning',
                    description        = p.get('description', ''),
                    goal               = p.get('goal', ''),
                    careers            = p.get('careers', []),
                    fee_per_semester   = fee if fee > 0 else None,
                    semesters          = semesters if semesters > 0 else None,
                    duration_years     = duration,
                    entry_requirements = p.get('entry_requirements', ''),
                    is_active          = True,
                )
                saved += 1

            except Exception as e:
                errors.append(f"{p.get('name', '?')}: {str(e)}")
                skipped += 1

        return Response({'saved': saved, 'skipped': skipped, 'errors': errors})