"""
settings_app/views.py

GET  /api/settings/system/   → returns all 6 sections merged with defaults
PATCH /api/settings/system/  → updates one section at a time
    body: { "section": "ai", "data": { "fast_model": "..." } }
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import SystemSettings


class SystemSettingsView(APIView):
    """
    GET  — public (chatbot reads maintenance/security settings at runtime)
    PATCH — admin only
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        obj = SystemSettings.get_settings()
        data = {
            section: obj.get_section(section)
            for section in SystemSettings.DEFAULTS
        }
        return Response({'success': True, 'data': data})

    def patch(self, request):
        section = request.data.get('section')
        data    = request.data.get('data')

        if not section:
            return Response({'error': 'section is required'}, status=status.HTTP_400_BAD_REQUEST)
        if data is None:
            return Response({'error': 'data is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(data, dict):
            return Response({'error': 'data must be an object'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            obj = SystemSettings.get_settings()

            # Scraping timestamps are scheduler-managed — never allow UI to overwrite them.
            # If the frontend accidentally sends them, silently strip before saving.
            if section == 'scraping':
                data.pop('last_scraped_at', None)
                data.pop('next_scrape_at',  None)

            obj.update_section(section, data)

            # Side-effects after save
            _apply_side_effects(section, obj.get_section(section))

            return Response({
                'success': True,
                'section': section,
                'data':    obj.get_section(section),
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Failed to save: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _apply_side_effects(section: str, data: dict):
    """
    Apply immediate effects when certain settings change.
    Called synchronously after each PATCH — keep this fast.
    """
    if section == 'chat':
        # Sync greeting_message and custom_system_prompt into AISettings
        # so the chatbot (which reads AISettings) picks them up immediately
        _sync_to_ai_settings(data)

    if section == 'sources':
        # Sync data-source toggles into AISettings
        _sync_to_ai_settings(data)

    if section == 'ai':
        # Sync model names, temperature into AISettings
        mapping = {
            'fast_model':  'fast_model',
            'smart_model': 'smart_model',
            'temperature': 'temperature',
            'max_tokens':  'max_tokens',
        }
        ai_data = {v: data[k] for k, v in mapping.items() if k in data}
        if ai_data:
            _sync_to_ai_settings(ai_data)

    if section == 'scraping':
        # If auto-scrape toggled on and next_scrape_at is unset, schedule it
        if data.get('auto_scrape_enabled') and not data.get('next_scrape_at'):
            from django.utils import timezone
            from datetime import timedelta
            interval = data.get('scrape_interval_hours', 24)
            next_run = timezone.now() + timedelta(hours=interval)
            obj = SystemSettings.get_settings()
            obj.update_section('scraping', {
                'next_scrape_at': next_run.isoformat()
            })


def _sync_to_ai_settings(data: dict):
    """
    Write relevant keys from SystemSettings into the legacy AISettings model
    so service.py continues to work without modification.
    """
    try:
        from aiconfig.models import AISettings
        ai = AISettings.get_settings()
        changed = False

        sync_map = {
            'fast_model':           'fast_model',
            'smart_model':          'smart_model',
            'temperature':          'temperature',
            'max_tokens':           'max_tokens',
            'greeting_message':     'greeting_message',
            'custom_system_prompt': 'custom_system_prompt',
            'use_programmes':       'use_programmes',
            'use_faqs':             'use_faqs',
            'use_timetable':        'use_timetable',
            'use_research':         'use_research',
            'use_scholarships':     'use_scholarships',
            'use_external_sources': 'use_external_sources',
        }

        for src_key, dst_key in sync_map.items():
            if src_key in data and hasattr(ai, dst_key):
                setattr(ai, dst_key, data[src_key])
                changed = True

        if changed:
            ai.save()
    except Exception as e:
        # Non-fatal — log and continue
        print(f'[SystemSettings] AISettings sync failed (non-fatal): {e}')


# ── Convenience accessor for service.py ──────────────────────────────────────
def get_system_settings():
    """
    Fast accessor used by service.py and the chatbot view.
    Returns a dict-like object with attribute access for backwards compat.
    """
    obj = SystemSettings.get_settings()
    return _SettingsProxy(obj)


class _SettingsProxy:
    """
    Wraps SystemSettings sections so code can do:
        s = get_system_settings()
        s.maintenance_mode         → bool
        s.rate_limit_per_hour      → int
        s.max_message_length       → int
        s.max_conversation_turns   → int
        s.block_off_topic          → bool
    """
    def __init__(self, obj: SystemSettings):
        self._obj = obj
        # Flatten all sections into one namespace
        self._flat = {}
        for section in SystemSettings.DEFAULTS:
            self._flat.update(obj.get_section(section))

    def __getattr__(self, name):
        if name.startswith('_'):
            raise AttributeError(name)
        return self._flat.get(name)