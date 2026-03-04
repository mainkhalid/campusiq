import re
import requests
from decouple import config
from programmes.models import Programme
from faq.models import FAQ
from timetable.models import Timetable, Session


class AIBotService:

    API_URL       = 'https://openrouter.ai/api/v1/chat/completions'
    MODEL         = 'liquid/lfm-2.5-1.2b-instruct:free'   # default — greetings, simple queries
    MODEL_PRECISE = 'arcee-ai/trinity-mini:free'     

    # ── Intent detection patterns ────────────────────────────
    TIMETABLE_QUERY_RE = re.compile(
        r'\b(class|lesson|timetable|schedule|unit|lecturer|teacher|room|venue|when|where|time)\b',
        re.IGNORECASE
    )
    PROGRAMME_QUERY_RE = re.compile(
        r'\b(programme|course|study|degree|diploma|certificate|enroll|admission|apply|intake|school|faculty|offer|what.*study|available.*course)\b',
        re.IGNORECASE
    )
    SCHOLARSHIP_QUERY_RE = re.compile(
        r'\b(scholarship|grant|funding|bursary|sponsor|financial.?aid)\b',
        re.IGNORECASE
    )
    FEE_QUERY_RE = re.compile(
        r'\b(fee|cost|how much|payment|tuition|invoice|charges)\b',
        re.IGNORECASE
    )
    GREETING_RE = re.compile(
        r'^\s*(hi|hello|hey|good\s*(morning|afternoon|evening|day)|howdy|sup|greetings|hola|niaje)\s*[!?.,]*\s*$',
        re.IGNORECASE
    )

    UNIT_CODE_RE = re.compile(r'\b([A-Z]{2,3})\s*(\d{2,3})\b', re.IGNORECASE)
    ROOM_RE      = re.compile(r'\b([AL]\d+)\b', re.IGNORECASE)

    def __init__(self):
        self.api_key = config('OPENROUTER_API_KEY', default='')

    # ── 1. Load admin settings ───────────────────────────────
    def _get_settings(self):
        try:
            from aiconfig.models import AISettings
            return AISettings.get_settings()
        except Exception:
            class _Defaults:
                use_programmes       = True
                use_faqs             = True
                use_timetable        = True
                use_research         = True
                use_scholarships     = True
                use_external_sources = True
                greeting_message     = "Hello! 👋 I'm your Zetech University assistant. How can I help you today?"
                custom_system_prompt = ''
                temperature          = 0.7
            return _Defaults()

    # ── 2. Intent detection ──────────────────────────────────
    def _detect_intent(self, message):
        is_greeting          = bool(self.GREETING_RE.match(message))
        is_timetable_query   = bool(self.TIMETABLE_QUERY_RE.search(message))
        is_programme_query   = bool(self.PROGRAMME_QUERY_RE.search(message))
        is_scholarship_query = bool(self.SCHOLARSHIP_QUERY_RE.search(message))
        is_fee_query         = bool(self.FEE_QUERY_RE.search(message))

        if is_fee_query:
            is_programme_query = True

        return {
            'is_greeting':          is_greeting,
            'is_timetable_query':   is_timetable_query,
            'is_programme_query':   is_programme_query,
            'is_scholarship_query': is_scholarship_query,
            'is_fee_query':         is_fee_query,
        }

    # ── 3. Data fetchers ─────────────────────────────────────

    def get_programmes(self, settings):
        if not settings.use_programmes:
            return []
        try:
            return list(
                Programme.objects.filter(is_active=True).values(
                    'id', 'name', 'code', 'school', 'level',
                    'duration_years', 'study_mode', 'campuses',
                    'entry_requirements', 'fee_structure',
                    'mean_grade', 'description', 'careers',
                )[:20]
            )
        except Exception as e:
            print(f'Programme fetch error: {e}')
            return []

    def get_faqs(self, settings):
        if not settings.use_faqs:
            return []
        try:
            return list(
                FAQ.objects.filter(status='published')
                .values('question', 'answer')[:15]
            )
        except Exception as e:
            print(f'FAQ fetch error: {e}')
            return []

    def get_scholarships(self, settings):
        if not settings.use_scholarships:
            return []
        try:
            from scholarships.models import Scholarship
            from django.utils import timezone
            return list(
                Scholarship.objects.filter(
                    published=True,
                    applications_open=True,
                    deadline__gte=timezone.now().date()
                ).values('name', 'provider', 'amount', 'deadline', 'eligibility', 'description')[:8]
            )
        except Exception as e:
            print(f'Scholarship fetch error: {e}')
            return []

    def get_research(self, settings):
        if not settings.use_research:
            return []
        try:
            from research.models import ResearchProject
            return list(
                ResearchProject.objects.filter(published=True)
                .values('title', 'department', 'lead', 'status', 'abstract')[:8]
            )
        except Exception as e:
            print(f'Research fetch error: {e}')
            return []

    def get_timetable_info(self, settings):
        if not settings.use_timetable:
            return {'available': False, 'timetables': [], 'schools': []}
        try:
            timetables = Timetable.objects.filter(status='published').values(
                'school_name', 'academic_year', 'semester', 'metadata'
            )
            if not timetables:
                return {'available': False, 'timetables': [], 'schools': []}

            availability, schools = [], set()
            for t in timetables:
                meta = t['metadata'] or {}
                availability.append({
                    'school':        t['school_name'],
                    'academicYear':  t['academic_year'],
                    'semester':      t['semester'],
                    'totalSessions': meta.get('totalSessions', 0),
                    'uniqueUnits':   len(meta.get('uniqueUnits', [])),
                })
                schools.add(t['school_name'])

            return {'available': True, 'timetables': availability, 'schools': list(schools)}
        except Exception as e:
            print(f'Timetable info error: {e}')
            return {'available': False, 'timetables': [], 'schools': []}

    def search_timetable(self, query, settings):
        if not settings.use_timetable:
            return []
        try:
            unit_match = self.UNIT_CODE_RE.search(query)
            if unit_match:
                unit_code = f"{unit_match.group(1).upper()} {unit_match.group(2)}"
                sessions  = Session.objects.filter(
                    timetable__status='published',
                    unit_code__iexact=unit_code
                ).select_related('timetable')[:10]
                return self._format_sessions(sessions)

            if 'lecturer' in query.lower() or 'teacher' in query.lower():
                name_match = re.search(
                    r'(?:lecturer|teacher|dr\.|prof\.|mr\.|mrs\.|ms\.)\s+([a-z\s]+)',
                    query, re.IGNORECASE
                )
                if name_match:
                    sessions = Session.objects.filter(
                        timetable__status='published',
                        lec_name__icontains=name_match.group(1).strip()
                    ).select_related('timetable')[:5]
                    return self._format_sessions(sessions)

            if 'room' in query.lower() or 'venue' in query.lower():
                room_match = self.ROOM_RE.search(query)
                if room_match:
                    sessions = Session.objects.filter(
                        timetable__status='published',
                        room__iexact=room_match.group(1).upper()
                    ).select_related('timetable')[:5]
                    return self._format_sessions(sessions)

            return []
        except Exception as e:
            print(f'Timetable search error: {e}')
            return []

    def _format_sessions(self, sessions):
        return [{
            'unitCode':    s.unit_code,
            'unitTitle':   s.unit_title,
            'lecName':     s.lec_name,
            'day':         s.day,
            'startTime':   s.start_time,
            'endTime':     s.end_time,
            'room':        s.room,
            'school':      s.timetable.school_name,
            'academicYear':s.timetable.academic_year,
            'semester':    s.timetable.semester,
        } for s in sessions]

    # ── 4. External knowledge base search ────────────────────

    def get_external_chunks(self, query, settings):
        """
        Search crawled website pages and indexed PDFs for content
        relevant to the student's query.
        Only runs when use_external_sources = True in AISettings.
        Returns a list of text strings ready to inject into the prompt.
        """
        try:
            if not getattr(settings, 'use_external_sources', False):
                return []
            from crawler.crawler_service import search_chunks
            return search_chunks(query)  # uses TOP_K constant from crawler_service
        except Exception as e:
            print(f'External chunk search error (non-fatal): {e}')
            return []

    # ── 5. Formatting ─────────────────────────────────────────

    def format_array(self, field):
        if not field:
            return 'N/A'
        return ', '.join(str(x) for x in field) if isinstance(field, list) else str(field)

    def format_programme(self, p):
        entry_reqs = p.get('entry_requirements') or {}
        min_grade  = entry_reqs.get('minimumGrade') or p.get('mean_grade') or 'N/A'
        fee_lines  = []
        for fee in (p.get('fee_structure') or []):
            if fee.get('totalFee'):
                fee_lines.append(
                    f"  Semester {fee.get('semester','?')}: KES {fee['totalFee']:,}"
                )
        fee_summary = ('- Fees:\n' + '\n'.join(fee_lines)) if fee_lines else ''
        return f"""{p['name']} ({p.get('code','')})
- Level: {p['level']} | School: {p['school']}
- Duration: {p.get('duration_years', 'N/A')} yrs | Modes: {self.format_array(p.get('study_mode'))}
- Campuses: {p.get('campuses') or 'N/A'} | Entry Grade: {min_grade}
{fee_summary}""".strip()

    # ── 6. System prompt ──────────────────────────────────────

    def create_system_prompt(self, settings, intent, programmes, faqs,
                              timetable_info, scholarships, research,
                              external_chunks=None):
        custom_section = ''
        if settings.custom_system_prompt and settings.custom_system_prompt.strip():
            custom_section = f"""
====================================
SPECIAL INSTRUCTIONS FROM ADMIN
====================================
{settings.custom_system_prompt.strip()}

"""
        programme_section = ''
        if intent['is_programme_query'] and settings.use_programmes and programmes:
            programme_list = '\n\n'.join(self.format_programme(p) for p in programmes[:12])
            programme_section = f"""
====================================
AVAILABLE PROGRAMMES
====================================
{programme_list}
"""

        faq_section = ''
        if settings.use_faqs and faqs:
            faq_list = '\n\n'.join(f"Q: {f['question']}\nA: {f['answer']}" for f in faqs)
            faq_section = f"""
====================================
FREQUENTLY ASKED QUESTIONS
====================================
{faq_list}
"""

        scholarship_section = ''
        if intent['is_scholarship_query'] and settings.use_scholarships and scholarships:
            s_list = '\n'.join(
                f"- {s['name']} by {s['provider']}: {s['amount']}, "
                f"Deadline: {s['deadline']}, For: {s['eligibility']}"
                for s in scholarships
            )
            scholarship_section = f"""
====================================
ACTIVE SCHOLARSHIPS & GRANTS
====================================
{s_list}
"""

        research_section = ''
        if settings.use_research and research:
            r_list = '\n'.join(
                f"- {r['title']} ({r['department']}) — {r['status']}"
                for r in research
            )
            research_section = f"""
====================================
RESEARCH & INNOVATION
====================================
{r_list}
"""

        timetable_section = ''
        if settings.use_timetable:
            if timetable_info['available']:
                summary = '\n'.join(
                    f"- {t['school']}: {t['academicYear']}, {t['semester']} ({t['totalSessions']} sessions)"
                    for t in timetable_info['timetables']
                )
                timetable_section = f"""
====================================
TIMETABLE
====================================
{summary}
Help students find schedules by unit code, lecturer name, or room number.
"""
            else:
                timetable_section = """
====================================
TIMETABLE
====================================
No timetable data is currently available. Direct students to the student portal.
"""

        # ── External knowledge base ───────────────────────────
        # Injected only when chunks matched the query (scored above 0.3 threshold)
        external_section = ''
        if external_chunks:
            joined = '\n\n'.join(external_chunks)
            external_section = f"""
====================================
EXTERNAL KNOWLEDGE BASE
(from crawled university website pages and uploaded documents)
====================================
{joined}
"""

        return f"""{custom_section}You are Zetech AI Assistant, the official academic advisor for Zetech University, Kenya.

====================================
YOUR ROLE
====================================
- Guide students in choosing the right programme
- Answer questions about admissions, fees, and campus life
- Help students find their class schedules
- Surface scholarships and research opportunities when asked
{programme_section}{faq_section}{scholarship_section}{research_section}{timetable_section}{external_section}
====================================
BEHAVIOUR RULES
====================================
- For greetings (hi, hello, good morning etc.) respond warmly and briefly. Ask how you can help. DO NOT list programmes or any data unprompted.
- Only share programme details when the student explicitly asks about courses, programmes, or fees
- Only mention scholarships when the student asks about funding or financial aid
- Answer one topic at a time
- Keep replies concise and structured
- Only use information provided above — never invent data
- If something is not in your data, say so clearly
- Use emojis sparingly (🎓 📚 📅)
"""

    # ── 7. Main chat entry point ──────────────────────────────

    def chat(self, message, history=None):
        if history is None:
            history = []

        settings = self._get_settings()

        try:
            # Step 1 — Detect intent
            intent = self._detect_intent(message)

            # Step 2 — Short-circuit for pure greetings
            if intent['is_greeting']:
                self._write_log(message, "Greeting response", [], [])
                return {
                    'response':         "Hello! 👋 Welcome to Zetech University. How can I help you today? You can ask me about programmes, fees, timetables, or scholarships.",
                    'programmes':       [],
                    'faqs':             [],
                    'timetableResults': [],
                    'greeting':         settings.greeting_message,
                    'error':            False,
                }

            # Step 3 — Fetch internal data based on intent
            programmes     = self.get_programmes(settings)   if intent['is_programme_query']   else []
            faqs           = self.get_faqs(settings)
            scholarships   = self.get_scholarships(settings) if intent['is_scholarship_query'] else []
            research       = self.get_research(settings)
            timetable_info = self.get_timetable_info(settings)

            # Step 4 — Search external knowledge base (crawled pages + PDFs)
            external_chunks = self.get_external_chunks(message, settings)

            # Step 5 — Search timetable only if relevant
            timetable_results = []
            if intent['is_timetable_query']:
                timetable_results = self.search_timetable(message, settings)

            # Step 6 — Build prompt with all relevant data including external chunks
            system_prompt = self.create_system_prompt(
                settings, intent, programmes, faqs,
                timetable_info, scholarships, research,
                external_chunks=external_chunks,
            )

            # Step 7 — Inject retrieved data directly into the user message
            # Placing it here (next to the question) forces small models to
            # use it rather than relying on training knowledge.
            enhanced_message = message

            # Inject external chunks first — fees, programmes, website content
            if external_chunks:
                chunks_text = '\n\n'.join(external_chunks)
                enhanced_message = (
                    f"Use ONLY the following information to answer. "
                    f"Do NOT use any outside knowledge or invent figures.\n\n"
                    f"RETRIEVED INFORMATION:\n{chunks_text}\n\n"
                    f"STUDENT QUESTION: {message}"
                )

            # Inject timetable results if found
            if timetable_results:
                results_text = '\n'.join(
                    f"{s['unitCode']} ({s['unitTitle']}) - "
                    f"{s['day']}, {s['startTime']}-{s['endTime']}, "
                    f"Room: {s['room']}, Lecturer: {s['lecName']}"
                    for s in timetable_results
                )
                enhanced_message = f"{enhanced_message}\n\n[Timetable data found]:\n{results_text}"

            # Step 8 — Call OpenRouter
            # Use the stronger model when external chunks are present —
            # small models hallucinate even when the data is right in front of them
            model_to_use = self.MODEL_PRECISE if external_chunks else self.MODEL
            print(f'[AIBot] chunks={len(external_chunks)} model={model_to_use}')

            messages = [
                {'role': 'system', 'content': system_prompt},
                *history,
                {'role': 'user',   'content': enhanced_message},
            ]

            response = requests.post(
                self.API_URL,
                json={
                    'model':       model_to_use,
                    'messages':    messages,
                    'temperature': settings.temperature,
                    'max_tokens':  900,
                },
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type':  'application/json',
                },
                timeout=30
            )
            response.raise_for_status()
            bot_response = response.json()['choices'][0]['message']['content']

            # Step 9 — Write lightweight log
            self._write_log(message, bot_response, timetable_results, programmes)

            # Step 10 — Return response
            return {
                'response':         bot_response,
                'programmes':       programmes[:5] if intent['is_programme_query'] else [],
                'faqs':             faqs[:3],
                'timetableResults': timetable_results[:5],
                'greeting':         settings.greeting_message,
                'error':            False,
            }

        except Exception as e:
            print(f'AI Error: {e}')
            return {
                'response': "I'm experiencing technical difficulties. Please try again shortly.",
                'error':    True,
            }

    # ── 8. Write log ──────────────────────────────────────────

    def _write_log(self, message, response, timetable_results, programmes):
        try:
            from aiconfig.models import ChatLog
            from aiconfig.views import detect_topic
            ChatLog.objects.create(
                topic                 = detect_topic(message),
                message               = message[:500],
                response              = response[:800],
                was_helpful           = bool(timetable_results or programmes),
                had_timetable_results = bool(timetable_results),
                had_programme_results = bool(programmes),
            )
        except Exception as e:
            print(f'ChatLog write error (non-fatal): {e}')

    # ── 9. Quick actions ──────────────────────────────────────

    def get_quick_actions(self):
        return [
            {'id': 'cert',      'text': 'Certificates',    'query': 'Show certificate programmes'},
            {'id': 'dip',       'text': 'Diplomas',         'query': 'Show diploma programmes'},
            {'id': 'deg',       'text': 'Degrees',          'query': 'Show degree programmes'},
            {'id': 'apply',     'text': '📝 How to Apply',  'query': 'How do I apply?'},
            {'id': 'req',       'text': 'Requirements',     'query': 'What are the entry requirements?'},
            {'id': 'timetable', 'text': '📅 My Timetable',  'query': 'Show my class schedule'},
            {'id': 'scholars',  'text': '🎓 Scholarships',  'query': 'What scholarships are available?'},
        ]


ai_service = AIBotService()