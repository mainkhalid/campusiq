import re
import requests
from django.db.models import F, Q
from django.utils import timezone
from decouple import config
from programmes.models import Programme
from faq.models import FAQ
from timetable.models import Timetable, Session


# ── Topic classifier ──────────────────────────────────────────────────────────
_TOPIC_RE = {
    'timetable':    re.compile(r'\b(class|timetable|schedule|room|venue|lecturer|unit|session|time)\b', re.I),
    'scholarships': re.compile(r'\b(scholarship|grant|funding|bursary|sponsor)\b', re.I),
    'fees':         re.compile(r'\b(fee|cost|how much|tuition|payment|invoice)\b', re.I),
    'programmes':   re.compile(r'\b(programme|course|diploma|degree|certificate|study|enroll)\b', re.I),
    'admissions':   re.compile(r'\b(admit|admission|apply|application|intake|join|register)\b', re.I),
    'research':     re.compile(r'\b(research|project|innovation|milestone|publish)\b', re.I),
    'news':         re.compile(r'\b(news|event|announcement|happening|latest|recent|update|activity)\b', re.I),
}

def _classify_topic(message: str) -> str:
    for topic, pattern in _TOPIC_RE.items():
        if pattern.search(message):
            return topic
    return 'general'


class AIBotService:

    API_URL = 'https://openrouter.ai/api/v1/chat/completions'

    TIMETABLE_QUERY_RE = re.compile(
        r'\b(class|lesson|timetable|schedule|unit|lecturer|teacher|room|venue|when|where|time'
        r'|Y\dS\d|SEM\s*\d|MOD\s*\d)\b',
        re.IGNORECASE
    )
    PROGRAMME_GROUP_RE = re.compile(
        r'\b([A-Z]{2,6}(?:\s[A-Z]{2,6})?)'
        r'\s+(?:Y\dS\d|SEM\s*\d|MOD\s*\d)',
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
        r'\b(fee|cost|how much|payment|tuition|invoice|charges|semester|per semester)\b',
        re.IGNORECASE
    )
    GREETING_RE = re.compile(
        r'^\s*(hi|hello|hey|good\s*(morning|afternoon|evening|day)|howdy|sup|greetings|hola|niaje)\s*[!?.,]*\s*$',
        re.IGNORECASE
    )
    # Matches news, events, announcements and specific event keywords
    NEWS_QUERY_RE = re.compile(
        r'\b(news|event|announcement|happening|latest|recent|update|activities'
        r'|what.*going\s*on|upcoming|campus\s*event|university\s*news'
        r'|hackathon|competition|seminar|workshop|convocation'
        r'|partnership|mou|launch|award|achievement|milestone)\b',
        re.IGNORECASE
    )
    CHUNK_ONLY_RE = re.compile(
        r'\b(hostel|accommodation|housing|dormitory|transport|bus|shuttle|parking'
        r'|library|librari|book|journal|database|e-resource|myLOFT'
        r'|alumni|graduate|graduation|convocation'
        r'|research|innovation|publication|project|grant'
        r'|club|sport|activity|welfare|counsell|health\s*service'
        r'|career|placement|internship|attachm'
        r'|cafeteria|canteen|food|restaurant)\b',
        re.IGNORECASE
    )
    FOLLOWUP_RE = re.compile(
        r'^\s*(how much|what(?:\s+is|\s+are|\s+about)?|tell me more|and|also'
        r'|any(thing)?|more|details?|explain|cost|price|fees?|charges?|when|where|who)\b',
        re.IGNORECASE
    )
    UNIT_CODE_RE = re.compile(r'\b([A-Z]{2,5})\s*(\d{2,3})\b', re.IGNORECASE)
    ROOM_RE      = re.compile(r'\b([AL]\d+)\b', re.IGNORECASE)

    def __init__(self):
        self.api_key = config('OPENROUTER_API_KEY', default='')

    # ── 1. Settings ───────────────────────────────────────────────────────────
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
                fast_model           = 'arcee-ai/trinity-mini:free'
                smart_model          = 'arcee-ai/trinity-large-preview:free'
                greeting_message     = "Hello! 👋 I'm your Zetech University assistant. How can I help you today?"
                custom_system_prompt = ''
                temperature          = 0.7
            return _Defaults()

    # ── 2. Intent detection ───────────────────────────────────────────────────
    def _detect_intent(self, message, history=None):
        if history is None:
            history = []

        is_fee_query         = bool(self.FEE_QUERY_RE.search(message))
        is_programme_query   = bool(self.PROGRAMME_QUERY_RE.search(message)) or is_fee_query
        is_timetable_query   = bool(self.TIMETABLE_QUERY_RE.search(message))
        is_scholarship_query = bool(self.SCHOLARSHIP_QUERY_RE.search(message))
        is_greeting          = bool(self.GREETING_RE.match(message))
        is_news_query        = bool(self.NEWS_QUERY_RE.search(message))

        is_research_query = bool(self.CHUNK_ONLY_RE.search(message) and
                                 re.search(r'\b(research|innovation|publication|project)\b', message, re.I))

        is_faq_relevant = not is_timetable_query or is_programme_query or is_scholarship_query

        needs_chunks = bool(self.CHUNK_ONLY_RE.search(message))

        # Carry-over: chunk-only topic in recent history + short follow-up
        if not needs_chunks and self.FOLLOWUP_RE.match(message):
            recent_text = ' '.join(
                m.get('content', '') for m in history[-4:]
                if isinstance(m.get('content'), str)
            )
            if self.CHUNK_ONLY_RE.search(recent_text):
                needs_chunks = True

        # Carry-over: news topic in recent history + short follow-up
        if not is_news_query and self.FOLLOWUP_RE.match(message):
            recent_text = ' '.join(
                m.get('content', '') for m in history[-4:]
                if isinstance(m.get('content'), str)
            )
            if self.NEWS_QUERY_RE.search(recent_text):
                is_news_query = True

        return {
            'is_greeting':          is_greeting,
            'is_timetable_query':   is_timetable_query,
            'is_programme_query':   is_programme_query,
            'is_scholarship_query': is_scholarship_query,
            'is_fee_query':         is_fee_query,
            'is_research_query':    is_research_query,
            'is_news_query':        is_news_query,
            'is_faq_relevant':      is_faq_relevant,
            'needs_chunks':         needs_chunks,
        }

    # ── 3a. Programmes ────────────────────────────────────────────────────────
    def get_programmes(self, message, settings):
        if not settings.use_programmes:
            return []
        try:
            qs = Programme.objects.filter(is_active=True)
            msg_lower = message.lower()

            if 'diploma' in msg_lower:
                qs = qs.filter(level='Diploma')
            elif 'certificate' in msg_lower:
                qs = qs.filter(level='Certificate')
            elif 'degree' in msg_lower or 'bachelor' in msg_lower:
                qs = qs.filter(level='Degree')
            elif 'master' in msg_lower or 'mba' in msg_lower or 'msc' in msg_lower:
                qs = qs.filter(level='Masters')
            elif 'phd' in msg_lower or 'doctor' in msg_lower or 'doctorate' in msg_lower:
                qs = qs.filter(level='Doctorate')

            if any(kw in msg_lower for kw in ['ict', 'computer', 'software', 'technology', 'engineering', 'media']):
                qs = qs.filter(school='ict')
            elif any(kw in msg_lower for kw in ['business', 'commerce', 'accounting', 'finance', 'marketing', 'economics']):
                qs = qs.filter(school='business')
            elif any(kw in msg_lower for kw in ['law', 'legal']):
                qs = qs.filter(school='law')
            elif any(kw in msg_lower for kw in ['health', 'nursing', 'medical', 'clinical']):
                qs = qs.filter(school='health')
            elif any(kw in msg_lower for kw in ['education', 'arts', 'social', 'journalism', 'psychology']):
                qs = qs.filter(school='education')

            return list(qs.values(
                'id', 'name', 'code', 'school', 'level',
                'duration_years', 'modes', 'campuses',
                'entry_requirements', 'mean_grade',
                'description', 'careers', 'goal',
                'fee_per_semester', 'semesters',
            )[:20])
        except Exception as e:
            print(f'Programme fetch error: {e}')
            return []

    # ── 3b. FAQs, scholarships, research ─────────────────────────────────────
    def get_faqs(self, settings):
        if not settings.use_faqs:
            return []
        try:
            return list(FAQ.objects.filter(status='published').values('question', 'answer')[:15])
        except Exception as e:
            print(f'FAQ fetch error: {e}')
            return []

    def get_scholarships(self, settings):
        if not settings.use_scholarships:
            return []
        try:
            from scholarships.models import Scholarship
            return list(
                Scholarship.objects.filter(
                    published=True, applications_open=True,
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

    # ── 3c. News & Events ─────────────────────────────────────────────────────
    def get_news(self, message):
        """
        Fetch relevant published NewsPost articles for a news/events query.

        Strategy:
          1. Extract meaningful keywords from the message
          2. Search title + content for those keywords (OR filter)
          3. If keyword search returns < 3 results, pad with most recent articles
          4. Always return at most 6 articles to keep context size bounded
          5. Content truncated to 400 chars — enough for the LLM to summarise,
             not so much it bloats the prompt
        """
        try:
            from news.models import NewsPost

            msg_lower = message.lower()
            qs = NewsPost.objects.filter(status='published')

            # Category filter
            if any(kw in msg_lower for kw in ['event', 'upcoming', 'happening', 'activity']):
                qs = qs.filter(category='event').order_by('-event_date', '-created_at')
            elif any(kw in msg_lower for kw in ['announcement', 'notice', 'deadline']):
                qs = qs.filter(category='announcement').order_by('-created_at')
            else:
                qs = qs.order_by('-created_at')

            # Keyword extraction — skip short words and common stopwords
            STOPWORDS = {
                'what', 'when', 'where', 'tell', 'about', 'zetech', 'university',
                'latest', 'recent', 'news', 'events', 'happening', 'campus',
                'with', 'from', 'that', 'this', 'have', 'been', 'show', 'does',
                'will', 'there', 'some', 'any', 'are', 'the', 'and', 'for',
            }
            keywords = [
                w for w in re.findall(r'\b[a-z]{4,}\b', msg_lower)
                if w not in STOPWORDS
            ]

            articles = []
            if keywords:
                kw_filter = Q()
                for kw in keywords[:5]:
                    kw_filter |= Q(title__icontains=kw) | Q(content__icontains=kw)
                articles = list(qs.filter(kw_filter)[:6])

            # Pad with most recent if keyword search didn't fill 3 slots
            if len(articles) < 3:
                seen_ids = [a.id for a in articles]
                articles += list(qs.exclude(id__in=seen_ids)[:6 - len(articles)])

            return [
                {
                    'title':         a.title,
                    'category':      a.category,
                    'content':       a.content[:400],
                    'event_date':    str(a.event_date) if a.event_date else '',
                    'external_link': a.external_link or '',
                    'tags':          a.tags or [],
                }
                for a in articles
            ]

        except Exception as e:
            print(f'News fetch error: {e}')
            return []

    # ── 4. External chunks ────────────────────────────────────────────────────
    def get_external_chunks(self, query, intent, settings):
        if not getattr(settings, 'use_external_sources', False):
            return []

        # Pure programme/fee query — DB is authoritative, chunks add nothing
        if (intent['is_programme_query'] or intent['is_fee_query']) and not intent['needs_chunks']:
            print('[AIBot] Skipping chunks — pure programme/fee query routed to DB')
            return []

        # Pure news query (no chunk-only topic) — NewsPost DB is enough.
        # But when a query touches BOTH news AND chunk-only topics
        # (e.g. "graduation ceremony details", "hostel news", "convocation requirements")
        # run chunks too — news gives the date/announcement, chunks give the
        # process details from crawled pages. Both sources contribute.
        if intent['is_news_query'] and not intent['needs_chunks']:
            return []

        try:
            from crawler.crawler_service import search_chunks
            return search_chunks(query)
        except Exception as e:
            print(f'External chunk search error (non-fatal): {e}')
            return []

    # ── 5. Format helpers ─────────────────────────────────────────────────────
    def format_array(self, field):
        if not field:
            return 'N/A'
        return ', '.join(str(x) for x in field) if isinstance(field, list) else str(field)

    def format_programme(self, p):
        fee_line = ''
        if p.get('fee_per_semester'):
            sems = f" × {p['semesters']} semesters" if p.get('semesters') else ''
            fee_line = f"- Fee: KES {int(p['fee_per_semester']):,}/semester{sems}"
        else:
            for fee in (p.get('fee_structure') or []):
                if fee.get('totalFee'):
                    fee_line = f"- Fee: KES {fee['totalFee']:,}/semester"
                    break

        entry = p.get('mean_grade') or ''
        if not entry and isinstance(p.get('entry_requirements'), str):
            entry = p.get('entry_requirements', '')[:100]

        lines = [
            f"{p['name']}" + (f" ({p['code']})" if p.get('code') else ''),
            f"- Level: {p.get('level', 'N/A')} | School: {p.get('school', 'N/A')}",
            f"- Duration: {p.get('duration_years', 'N/A')} yrs | Modes: {p.get('modes') or 'N/A'}",
            f"- Campuses: {p.get('campuses') or 'N/A'}" + (f" | Entry: {entry}" if entry else ''),
        ]
        if fee_line:
            lines.append(fee_line)
        if p.get('careers'):
            careers_list = p['careers'] if isinstance(p['careers'], list) else []
            if careers_list:
                lines.append(f"- Careers: {', '.join(str(c) for c in careers_list[:5])}")
        if p.get('description'):
            lines.append(f"- About: {str(p['description'])[:200]}")
        return '\n'.join(lines)

    def format_news_article(self, a):
        """Format a single news article for LLM context injection."""
        lines = [f"[{a['category'].upper()}] {a['title']}"]
        if a.get('event_date'):
            lines.append(f"Date: {a['event_date']}")
        if a.get('content'):
            lines.append(a['content'])
        if a.get('external_link'):
            lines.append(f"Read more: {a['external_link']}")
        return '\n'.join(lines)

    # ── 6. System prompt ──────────────────────────────────────────────────────
    def create_system_prompt(self, settings, intent, faqs,
                             timetable_info, scholarships, research, news):
        custom_section = ''
        if settings.custom_system_prompt and settings.custom_system_prompt.strip():
            custom_section = f"""
====================================
SPECIAL INSTRUCTIONS FROM ADMIN
====================================
{settings.custom_system_prompt.strip()}

"""
        faq_section = ''
        if intent['is_faq_relevant'] and settings.use_faqs and faqs:
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
        if intent['is_research_query'] and settings.use_research and research:
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
        news_section = ''
        if intent['is_news_query'] and news:
            news_list = '\n\n'.join(self.format_news_article(a) for a in news)
            news_section = f"""
====================================
RECENT NEWS & EVENTS
====================================
{news_list}
"""
        timetable_section = ''
        if settings.use_timetable:
            if timetable_info['available']:
                summary = '\n'.join(
                    f"- {t['school']} ({t.get('campus', '')}): {t['academicYear']}, "
                    f"{t['semester']} — {t['totalSessions']} sessions across {t['programmeCount']} programme groups"
                    for t in timetable_info['timetables']
                )
                timetable_section = f"""
====================================
TIMETABLE
====================================
{summary}
You can look up sessions by:
- Programme group (e.g. 'BBAM Y1S1', 'DAC SEM2', 'CEE MOD 1 TERM 3')
- Unit code (e.g. 'BAC 111', 'ICT 201')
- Lecturer name
- Room / venue (e.g. 'A103', 'L205')
When a student asks for a programme timetable, list ALL sessions for that group
formatted as: Day | Time | Unit Code – Title | Lecturer | Room
"""
            else:
                timetable_section = """
====================================
TIMETABLE
====================================
No timetable data is currently available. Direct students to the student portal.
"""
        return f"""{custom_section}You are Zetech AI Assistant, the official academic advisor for Zetech University, Kenya.

====================================
YOUR ROLE
====================================
- Guide students in choosing the right programme
- Answer questions about admissions, fees, and campus life
- Help students find their class schedules
- Surface scholarships and research opportunities when asked
- Share campus news, events and announcements when asked
{faq_section}{scholarship_section}{research_section}{news_section}{timetable_section}
====================================
BEHAVIOUR RULES
====================================
- For greetings respond warmly and briefly — DO NOT list programmes unprompted
- Only share programme details when the student explicitly asks
- Fee data comes from the university database — always use it, never invent figures
- Do not calculate the total fee — show fee as-is per semester
- Only mention scholarships when asked about funding or financial aid
- For news/events: summarise clearly, include the date if available, and provide
  the external link so the student can read the full story
- Answer one topic at a time, keep replies concise and structured
- Only use information provided above — never invent data
- If something is not in your data, say so clearly
- Use emojis sparingly (🎓 📚 📅 📰)
"""

    # ── 7. Main chat entry point ──────────────────────────────────────────────
    def chat(self, message, conversation=None, request=None):
        """
        request: optional DRF/Django request — used for rate limiting by IP.
        """
        # ── System-level checks (maintenance, security) ───────────────────────
        try:
            from settings_app.views import get_system_settings
            sys = get_system_settings()

            # Maintenance mode — return immediately, no LLM call
            if sys.maintenance_mode:
                return {
                    'response': sys.maintenance_message or
                        'The assistant is temporarily unavailable. Please try again shortly.',
                    'error': False,
                    'maintenance': True,
                }

            # Message length guard — prevents prompt injection & token abuse
            max_len = sys.max_message_length or 500
            if len(message) > max_len:
                return {
                    'response': f'Your message is too long. Please keep it under {max_len} characters.',
                    'error': False,
                }

        except Exception:
            pass  # settings_app not installed — continue with defaults

        if conversation is not None:
            db_messages = conversation.messages.order_by('created_at')
            history = [{'role': m.role, 'content': m.content} for m in db_messages]
        else:
            history = []

        # ── Conversation turn cap — sliding window ────────────────────────────
        try:
            from settings_app.views import get_system_settings
            sys = get_system_settings()
            max_turns = sys.max_conversation_turns or 20
            # Each turn = 1 user + 1 assistant message; cap at max_turns pairs
            if len(history) > max_turns * 2:
                history = history[-(max_turns * 2):]
        except Exception:
            # Fallback: hard cap at 20 turns
            if len(history) > 40:
                history = history[-40:]

        settings = self._get_settings()

        try:
            intent = self._detect_intent(message, history)

            # Short-circuit greetings
            if intent['is_greeting']:
                bot_response = settings.greeting_message
                if conversation is not None:
                    from .models import Message
                    Message.objects.bulk_create([
                        Message(conversation=conversation, role='user',      content=message),
                        Message(conversation=conversation, role='assistant', content=bot_response),
                    ])
                return {'response': bot_response, 'error': False}

            # Conditional data fetches
            programmes      = self.get_programmes(message, settings) if intent['is_programme_query'] else []
            scholarships    = self.get_scholarships(settings)        if intent['is_scholarship_query'] else []
            research        = self.get_research(settings)            if intent['is_research_query'] else []
            faqs            = self.get_faqs(settings)                if intent['is_faq_relevant'] else []
            news            = self.get_news(message)                 if intent['is_news_query'] and getattr(settings, 'use_news', True) else []
            timetable_info  = self.get_timetable_info(settings)      if intent['is_timetable_query'] else {'available': False, 'timetables': [], 'schools': []}
            external_chunks = self.get_external_chunks(message, intent, settings)

            timetable_results = []
            if intent['is_timetable_query']:
                timetable_results = self.search_timetable(message, settings)

            system_prompt = self.create_system_prompt(
                settings, intent, faqs,
                timetable_info, scholarships, research, news,
            )

            # Build enhanced_message
            enhanced_message = message

            if intent['is_news_query'] and news:
                news_text = '\n\n'.join(self.format_news_article(a) for a in news)
                if external_chunks:
                    # Query touches both news and chunk-only topics (e.g. graduation,
                    # hostel) — merge both sources so the bot can answer fully.
                    chunks_text = '\n\n'.join(external_chunks)
                    enhanced_message = (
                        f"Use the following information to answer the student's question.\n\n"
                        f"NEWS & EVENTS (from university news database):\n{news_text}\n\n"
                        f"ADDITIONAL DETAILS (from university website):\n{chunks_text}\n\n"
                        f"STUDENT QUESTION: {message}"
                    )
                else:
                    enhanced_message = (
                        f"Use ONLY the following Zetech University news and events to answer.\n\n"
                        f"NEWS & EVENTS:\n{news_text}\n\n"
                        f"STUDENT QUESTION: {message}"
                    )
            elif intent['is_programme_query'] and programmes and not intent['needs_chunks']:
                prog_text = '\n\n'.join(self.format_programme(p) for p in programmes[:10])
                enhanced_message = (
                    f"Use ONLY the following university database information to answer.\n\n"
                    f"PROGRAMMES FROM DATABASE:\n{prog_text}\n\n"
                    f"STUDENT QUESTION: {message}"
                )
            elif external_chunks:
                chunks_text = '\n\n'.join(external_chunks)
                enhanced_message = (
                    f"Use ONLY the following information to answer. Do NOT invent any data.\n\n"
                    f"RETRIEVED INFORMATION:\n{chunks_text}\n\n"
                    f"STUDENT QUESTION: {message}"
                )

            if timetable_results:
                by_prog = {}
                for s in timetable_results:
                    by_prog.setdefault(s.get('programme', ''), []).append(s)
                parts = []
                for prog, slist in by_prog.items():
                    if prog:
                        parts.append(f"[{prog}]")
                    for s in slist:
                        parts.append(
                            f"{s['day']} {s['startTime']}-{s['endTime']} | "
                            f"{s['unitCode']} – {s['unitTitle']} | "
                            f"{s['lecName']} | {s['room']}"
                        )
                enhanced_message += f"\n\n[Timetable data]:\n{chr(10).join(parts)}"

            has_data      = bool(programmes or external_chunks or timetable_results or news)
            primary_model  = settings.smart_model if has_data else settings.fast_model
            fallback_model = settings.fast_model if primary_model == settings.smart_model else settings.smart_model

            intent_label = (
                'news'    if intent['is_news_query'] else
                'prog'    if intent['is_programme_query'] else
                'general'
            )
            print(
                f'[AIBot] intent={intent_label} news={len(news)} '
                f'programmes={len(programmes)} chunks={len(external_chunks)} '
                f'timetable={len(timetable_results)} model={primary_model}'
            )

            messages = [
                {'role': 'system', 'content': system_prompt},
                *history,
                {'role': 'user',   'content': enhanced_message},
            ]
            payload = {
                'messages':    messages,
                'temperature': settings.temperature,
                'max_tokens':  900,
            }
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type':  'application/json',
            }

            try:
                payload['model'] = primary_model
                response = requests.post(self.API_URL, json=payload, headers=headers, timeout=25)
                response.raise_for_status()
                bot_response = response.json()['choices'][0]['message']['content']
            except Exception as e:
                print(f'[AIBot] Primary model {primary_model} failed ({e}), trying fallback {fallback_model}')
                payload['model'] = fallback_model
                response = requests.post(self.API_URL, json=payload, headers=headers, timeout=30)
                response.raise_for_status()
                bot_response = response.json()['choices'][0]['message']['content']

            if conversation is not None:
                from .models import Message
                Message.objects.bulk_create([
                    Message(conversation=conversation, role='user',      content=message),
                    Message(conversation=conversation, role='assistant', content=bot_response),
                ])

            self._write_log(intent)

            return {'response': bot_response, 'error': False}

        except Exception as e:
            print(f'AI Error: {e}')
            return {
                'response': "I'm experiencing technical difficulties. Please try again shortly.",
                'error':    True,
            }

    # ── 8. Write log ──────────────────────────────────────────────────────────
    def _write_log(self, intent):
        try:
            from aiconfig.models import DailyStat

            if intent['is_fee_query']:
                topic = 'fees'
            elif intent['is_programme_query']:
                topic = 'programmes'
            elif intent['is_timetable_query']:
                topic = 'timetable'
            elif intent['is_scholarship_query']:
                topic = 'scholarships'
            elif intent['is_research_query']:
                topic = 'research'
            elif intent['is_news_query']:
                topic = 'news'
            else:
                topic = 'general'

            stat, _ = DailyStat.objects.get_or_create(
                date=timezone.now().date(),
                topic=topic,
            )
            DailyStat.objects.filter(pk=stat.pk).update(total=F('total') + 1)

        except Exception as e:
            print(f'DailyStat write error (non-fatal): {e}')

    # ── 9. Timetable helpers ──────────────────────────────────────────────────
    def get_timetable_info(self, settings):
        if not settings.use_timetable:
            return {'available': False, 'timetables': [], 'schools': []}
        try:
            timetables = Timetable.objects.filter(status='published').values(
                'school_name', 'academic_year', 'semester', 'campus', 'metadata'
            )
            if not timetables:
                return {'available': False, 'timetables': [], 'schools': []}
            availability, schools = [], set()
            for t in timetables:
                meta = t['metadata'] or {}
                availability.append({
                    'school':         t['school_name'],
                    'campus':         t.get('campus', ''),
                    'academicYear':   t['academic_year'],
                    'semester':       t['semester'],
                    'totalSessions':  meta.get('totalSessions', 0),
                    'programmeCount': meta.get('programmeCount', 0),
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
            prog_group_match = self.PROGRAMME_GROUP_RE.search(query)
            if prog_group_match:
                prog_label = prog_group_match.group(0).strip()
                sessions = Session.objects.filter(
                    timetable__status='published',
                    programme__icontains=prog_label
                ).select_related('timetable').order_by('day', 'start_time')[:30]
                return self._format_sessions(sessions)

            unit_match = self.UNIT_CODE_RE.search(query)
            if unit_match:
                unit_code = f"{unit_match.group(1).upper()} {unit_match.group(2)}"
                sessions  = Session.objects.filter(
                    timetable__status='published', unit_code__iexact=unit_code
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
            'programme':    s.programme,
            'unitCode':     s.unit_code,
            'unitTitle':    s.unit_title,
            'lecName':      s.lec_name,
            'day':          s.day,
            'startTime':    s.start_time,
            'endTime':      s.end_time,
            'room':         s.room,
            'school':       s.timetable.school_name,
            'academicYear': s.timetable.academic_year,
            'semester':     s.timetable.semester,
        } for s in sessions]

    # ── 10. Quick actions ─────────────────────────────────────────────────────
    def get_quick_actions(self):
        # All possible actions — source_flag=None means always show.
        # Actions whose flag is disabled are stripped so the student
        # never taps a chip that leads to a dead end.
        #
        # Read from SystemSettings (authoritative source) rather than
        # AISettings — the use_* fields may not exist as model fields
        # on AISettings, causing getattr to always fall back to True.
        sources = {}
        try:
            from settings_app.models import SystemSettings
            sources = SystemSettings.get_settings().get_section('sources')
        except Exception:
            # settings_app not installed — fall back to AISettings
            s = self._get_settings()
            sources = {
                'use_programmes':       getattr(s, 'use_programmes',       True),
                'use_faqs':             getattr(s, 'use_faqs',             True),
                'use_timetable':        getattr(s, 'use_timetable',        True),
                'use_research':         getattr(s, 'use_research',         True),
                'use_scholarships':     getattr(s, 'use_scholarships',     True),
                'use_external_sources': getattr(s, 'use_external_sources', True),
                'use_news':             getattr(s, 'use_news',             True),
            }

        ALL_ACTIONS = [
            {'id': 'cert',      'text': 'Certificates',    'query': 'Show certificate programmes',           'category': 'browse', 'source_flag': 'use_programmes'      },
            {'id': 'dip',       'text': 'Diplomas',        'query': 'Show diploma programmes',               'category': 'browse', 'source_flag': 'use_programmes'      },
            {'id': 'deg',       'text': 'Degrees',         'query': 'Show degree programmes',                'category': 'browse', 'source_flag': 'use_programmes'      },
            {'id': 'apply',     'text': '📝 How to Apply', 'query': 'How do I apply to Zetech?',             'category': 'action', 'source_flag': None                  },
            {'id': 'req',       'text': 'Requirements',    'query': 'What are the entry requirements?',      'category': 'action', 'source_flag': None                  },
            {'id': 'fees',      'text': 'Fee Structure',   'query': 'What are the fees at Zetech?',          'category': 'action', 'source_flag': 'use_programmes'      },
            {'id': 'timetable', 'text': '📅 My Timetable', 'query': 'Show my class schedule',                'category': 'action', 'source_flag': 'use_timetable'       },
            {'id': 'scholars',  'text': '🎓 Scholarships', 'query': 'What scholarships are available?',      'category': 'action', 'source_flag': 'use_scholarships'    },
            {'id': 'news',      'text': '📰 Latest News',  'query': 'What is the latest news at Zetech?',   'category': 'action', 'source_flag': 'use_news'             },
            {'id': 'host',      'text': 'Hostels',         'query': 'Tell me about student hostels',         'category': 'action', 'source_flag': 'use_external_sources'},
            {'id': 'research',  'text': '🔬 Research',     'query': 'What research is happening at Zetech?', 'category': 'action', 'source_flag': 'use_research'        },
        ]

        return [
            {k: v for k, v in action.items() if k != 'source_flag'}
            for action in ALL_ACTIONS
            if action['source_flag'] is None or sources.get(action['source_flag'], True)
        ]


ai_service = AIBotService()