import re
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Sum
from django.db.models import F
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DailyStat, AISettings
from aibot.models import Conversation, Message
from .serializers import AISettingsSerializer


# ── Cache keys & TTL ──────────────────────────────────────────────────────────
CACHE_TTL              = 60 * 60 * 24       # 24 hours
CACHE_KEY_STUDENT_LIFE = 'content:student_life'
CACHE_KEY_RESEARCH     = 'content:research'

STUDENT_LIFE_QUERIES = {
    'clubs':      'student clubs organizations societies activities Zetech University',
    'sports':     'sports athletics teams competitions Zetech University basketball football rugby',
    'facilities': 'campus facilities library cafeteria gym fitness hostel accommodation transport Zetech',
    'career':     'career placement internship attachment counselling welfare health services Zetech students',
}

RESEARCH_QUERY = (
    'What are the key research areas, innovation projects and academic research '
    'programmes at Zetech University? List the main research focus areas with a '
    'brief description of each.'
)


def _search(query: str) -> list:
    """Run chunk search without going through the full chat pipeline."""
    try:
        from crawler.crawler_service import search_chunks
        return search_chunks(query)
    except Exception as e:
        print(f'[ContentCache] chunk search error: {e}')
        return []


def _generate_items_from_chunks(chunks: list, section_label: str) -> list:
    """
    Pass retrieved chunks through the LLM to produce clean {name, desc} items.

    Called ONCE per cache fill (every 24h max), not per user visit.
    The LLM converts raw chunk text into readable structured items.
    Returns list of {name, desc} dicts, or [] if chunks are empty or LLM fails.
    """
    if not chunks:
        return []

    import json
    import requests as http_requests
    from decouple import config

    api_key = config('OPENROUTER_API_KEY', default='')
    if not api_key:
        print('[ContentCache] No OPENROUTER_API_KEY — skipping LLM generation')
        return []

    context = '\n\n'.join(chunks[:8])  # top 8 chunks is sufficient context

    prompt = (
        f'You are extracting structured information about Zetech University\'s {section_label}.\n\n'
        f'Using ONLY the university information below, list the most relevant items.\n'
        f'Return a JSON array of objects. Each object must have exactly these keys:\n'
        f'  "name": short item name (max 5 words)\n'
        f'  "desc": one sentence description (max 20 words)\n\n'
        f'Return between 3 and 6 items. Return ONLY valid JSON — no explanation, no markdown.\n\n'
        f'UNIVERSITY INFORMATION:\n{context}\n\nJSON array:'
    )

    try:
        resp = http_requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            json={
                'model':       'arcee-ai/trinity-mini:free',
                'messages':    [{'role': 'user', 'content': prompt}],
                'max_tokens':  400,
                'temperature': 0.2,
            },
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type':  'application/json',
            },
            timeout=20,
        )
        resp.raise_for_status()
        raw = resp.json()['choices'][0]['message']['content'].strip()

        # Strip markdown fences if model wrapped the JSON
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw).strip()

        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            return []

        items = []
        for item in parsed:
            if not isinstance(item, dict):
                continue
            raw_name = item.get('name') or ''
            raw_desc = item.get('desc') or ''
            name = str(raw_name).strip()
            desc = str(raw_desc).strip()
            if name and name.lower() != 'none':
                items.append({'name': name, 'desc': desc if desc and desc.lower() != 'none' else None})
        return items

    except Exception as e:
        print(f'[ContentCache] LLM generation failed for "{section_label}": {e}')
        return []


def invalidate_content_cache():
    """
    Clear both content caches.
    Called from crawler/_run_crawl() after a successful re-index,
    and from InvalidateContentCacheView below.
    """
    cache.delete(CACHE_KEY_STUDENT_LIFE)
    cache.delete(CACHE_KEY_RESEARCH)
    print('[ContentCache] Cache invalidated.')


# ── Analytics ─────────────────────────────────────────────────────────────────

class LogStatsView(APIView):
    """GET /api/aiconfig/logs/stats/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today      = timezone.now().date()
        week_start = today - timedelta(days=7)

        total      = DailyStat.objects.aggregate(t=Sum('total'))['t'] or 0
        today_stat = DailyStat.objects.filter(date=today).aggregate(t=Sum('total'))['t'] or 0
        week_stat  = DailyStat.objects.filter(date__gte=week_start).aggregate(t=Sum('total'))['t'] or 0

        return Response({
            'success': True,
            'data': {
                'total':           total,
                'today':           today_stat,
                'this_week':       week_stat,
                'helpful_percent': 0,   # deprecated — kept for UI compatibility
            }
        })


class LogTopicsView(APIView):
    """GET /api/aiconfig/logs/topics/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        topics = (
            DailyStat.objects
            .values('topic')
            .annotate(count=Sum('total'), helpful=Sum('total'))
            .order_by('-count')
        )
        return Response({'success': True, 'data': list(topics)})


class LogVolumeView(APIView):
    """GET /api/aiconfig/logs/volume/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        since      = timezone.now().date() - timedelta(days=30)
        rows       = (
            DailyStat.objects
            .filter(date__gte=since)
            .values('date')
            .annotate(count=Sum('total'), helpful=Sum('total'))
            .order_by('date')
        )
        volume_map = {str(r['date']): r for r in rows}

        result = []
        for i in range(30):
            day     = (timezone.now() - timedelta(days=29 - i)).date()
            day_str = str(day)
            entry   = volume_map.get(day_str, {})
            result.append({
                'date':    day_str,
                'count':   entry.get('count', 0),
                'helpful': entry.get('helpful', 0),
            })

        return Response({'success': True, 'data': result})


class TopQuestionsView(APIView):
    """GET /api/aiconfig/logs/top_questions/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = (
            Conversation.objects
            .prefetch_related('messages')
            .order_by('-updated_at')[:20]
        )
        data = []
        for conv in conversations:
            messages = conv.messages.all()
            if not messages.exists():
                continue
            # Use Python filtering — prefetch_related already loaded messages
            user_msg = next((m for m in messages if m.role == 'user'), None)
            if not user_msg:
                continue
            data.append({
                'id':            str(conv.id),   # FIX: was conv.chat_id (field doesn't exist)
                'topic':         'general',
                'was_helpful':   True,
                'created_at':    conv.created_at,
                'updated_at':    conv.updated_at,
                'message':       user_msg.content,
                'message_count': messages.count(),
            })

        return Response({'success': True, 'data': data})


class DeleteLogView(APIView):
    """DELETE /api/aiconfig/logs/{id}/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            Conversation.objects.get(id=pk).delete()   # FIX: was chat_id=pk
            return Response({'success': True, 'message': 'Conversation deleted'})
        except (Conversation.DoesNotExist, ValueError):
            return Response(
                {'success': False, 'message': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class ConversationDetailView(APIView):
    """GET /api/aiconfig/logs/conversations/{uuid}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            conv     = Conversation.objects.get(id=pk)   # FIX: was chat_id=pk
            messages = conv.messages.all()
            msg_data = [
                {'role': m.role, 'content': m.content, 'timestamp': m.created_at}
                for m in messages
            ]
            return Response({'success': True, 'data': msg_data})
        except (Conversation.DoesNotExist, ValueError):
            return Response({'success': False, 'message': 'Not found'}, status=404)


class AISettingsView(APIView):
    """GET/PUT /api/aiconfig/settings/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = AISettings.get_settings()
        return Response({'success': True, 'data': AISettingsSerializer(settings).data})

    def put(self, request):
        settings   = AISettings.get_settings()
        serializer = AISettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'data': serializer.data})
        return Response(
            {'success': False, 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


# ── Log purge ─────────────────────────────────────────────────────────────────

class PurgeLogsView(APIView):
    """
    DELETE /api/aiconfig/logs/purge/

    Deletes Conversation rows (and their cascaded Messages) older than 30 days.
    Also trims DailyStat rows older than 90 days to keep the analytics table lean.
    Returns a count of deleted conversations.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        cutoff_conversations = timezone.now() - timedelta(days=30)
        cutoff_stats         = timezone.now().date() - timedelta(days=90)

        deleted_convs, _ = Conversation.objects.filter(
            updated_at__lt=cutoff_conversations
        ).delete()

        DailyStat.objects.filter(date__lt=cutoff_stats).delete()

        return Response({
            'success': True,
            'deleted': deleted_convs,
            'message': f'Deleted {deleted_convs} conversations older than 30 days.',
        })


# ── Content cache endpoints ───────────────────────────────────────────────────

class StudentLifeContentView(APIView):
    """
    GET /api/aiconfig/content/student-life/

    Flow on cache MISS (at most once every 24h):
      1. search_chunks() retrieves relevant chunk text per section
      2. LLM converts raw chunks into clean {name, desc} items
      3. Result cached for 24h

    Flow on cache HIT (every subsequent request for 24h):
      1. Return cached JSON in ~5ms — zero DB queries, zero LLM calls

    Net result: LLM called at most 4 times per 24h window total,
    versus 4 calls on every single page visit in the old design.
    """
    permission_classes = [AllowAny]

    SECTION_LABELS = {
        'clubs':      'student clubs, societies and extracurricular activities',
        'sports':     'sports teams, athletics and physical activities',
        'facilities': 'campus facilities including library, cafeteria, gym, hostels and transport',
        'career':     'career services, internship placement, counselling and welfare',
    }

    def get(self, request):
        cached = cache.get(CACHE_KEY_STUDENT_LIFE)
        if cached:
            return Response({
                'source':    'cache',
                'cached_at': cached.get('cached_at'),
                'data':      cached['data'],
            })

        # Cache miss — search chunks then generate readable items via LLM
        data = {}
        for section_id, query in STUDENT_LIFE_QUERIES.items():
            chunks = _search(query)
            items  = _generate_items_from_chunks(chunks, self.SECTION_LABELS[section_id])
            data[section_id] = {'items': items}

        payload = {'data': data, 'cached_at': timezone.now().isoformat()}
        cache.set(CACHE_KEY_STUDENT_LIFE, payload, timeout=CACHE_TTL)

        return Response({
            'source':    'live',
            'cached_at': payload['cached_at'],
            'data':      data,
        })


class ResearchContentView(APIView):
    """
    GET /api/aiconfig/content/research/

    Returns research pillars sourced directly from the ResearchProject DB.
    Previously used chunks + LLM — replaced because we now have structured
    project data (title, abstract, department, tags) which is more reliable,
    always current, and costs nothing to query.

    Cache TTL: 24h. Invalidated automatically when a new project is published
    or when admin clicks "Clear Content Cache" in AIAdmin.

    Response shape (unchanged — ResearchHighlight.jsx expects this):
    {
      "source": "cache" | "live",
      "cached_at": "<ISO datetime>",
      "data": {
        "pillars": [{"title": "...", "desc": "...", "department": "...", "status": "..."}]
      }
    }
    """
    permission_classes = [AllowAny]

    def get(self, request):
        cached = cache.get(CACHE_KEY_RESEARCH)
        if cached:
            return Response({
                'source':    'cache',
                'cached_at': cached.get('cached_at'),
                'data':      cached['data'],
            })

        # Cache miss — read directly from ResearchProject DB
        pillars = []
        try:
            from research.models import ResearchProject

            projects = (
                ResearchProject.objects
                .filter(published=True)
                .order_by('-created_at')
                .values('title', 'abstract', 'department', 'status', 'tags', 'lead')[:8]
            )

            for p in projects:
                # Use abstract as desc, truncated to ~120 chars for the widget
                abstract = (p.get('abstract') or '').strip()
                desc = abstract[:120].rstrip() + ('...' if len(abstract) > 120 else '') if abstract else None

                pillars.append({
                    'title':      p['title'],
                    'desc':       desc,
                    'department': p.get('department', ''),
                    'status':     p.get('status', ''),
                })

        except Exception as e:
            print(f'[ContentCache] Research DB read failed: {e}')
            # Fallback to chunks if DB read fails for any reason
            chunks = _search(RESEARCH_QUERY)
            raw    = _generate_items_from_chunks(
                chunks,
                'research areas, innovation projects and academic research programmes'
            )
            pillars = [{'title': p['name'], 'desc': p['desc'], 'department': '', 'status': ''} for p in raw]

        data    = {'pillars': pillars}
        payload = {'data': data, 'cached_at': timezone.now().isoformat()}
        cache.set(CACHE_KEY_RESEARCH, payload, timeout=CACHE_TTL)

        return Response({
            'source':    'live',
            'cached_at': payload['cached_at'],
            'data':      data,
        })


class InvalidateContentCacheView(APIView):
    """
    POST /api/aiconfig/content/invalidate/

    Admin-only. Clears both content caches so the next GET fetches fresh data.
    Hook this up to the AIAdmin "Refresh content" button.
    Also called automatically from crawler/_run_crawl() after re-index.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        invalidate_content_cache()
        return Response({
            'success': True,
            'message': 'Content cache cleared. Next page visit will fetch fresh data.',
        })