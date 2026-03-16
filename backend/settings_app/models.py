"""
settings_app/models.py

Single-row settings table (singleton pattern, id=1 always).
Each section is a JSONField so adding new keys never requires a migration.
"""
from django.db import models
from django.utils import timezone


class SystemSettings(models.Model):

    # ── AI & Models ───────────────────────────────────────────────────────────
    ai = models.JSONField(default=dict, blank=True)

    # ── Chat Behaviour ────────────────────────────────────────────────────────
    chat = models.JSONField(default=dict, blank=True)

    # ── Data Sources ──────────────────────────────────────────────────────────
    sources = models.JSONField(default=dict, blank=True)

    # ── Security & Limits ─────────────────────────────────────────────────────
    security = models.JSONField(default=dict, blank=True)

    # ── Scraping Schedule ─────────────────────────────────────────────────────
    scraping = models.JSONField(default=dict, blank=True)

    # ── Maintenance ───────────────────────────────────────────────────────────
    maintenance = models.JSONField(default=dict, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'System Settings'
        verbose_name_plural = 'System Settings'

    # ── Section defaults — mirrors Settings.jsx DEFAULT_* consts ─────────────
    DEFAULTS = {
        'ai': {
            'openrouter_api_key': '',
            'fast_model':         'arcee-ai/trinity-mini:free',
            'smart_model':        'arcee-ai/trinity-large-preview:free',
            'embedding_backend':  'local',
            'embedding_model':    '',
            'temperature':        0.7,
            'max_tokens':         900,
            'timeout':            30,
        },
        'chat': {
            'greeting_message':     "Hello! 👋 I'm your Zetech University assistant. How can I help you today?",
            'bot_name':             'Zetech AI',
            'custom_system_prompt': '',
            'fallback_message':     "I'm sorry, I don't have information on that. Please contact the admissions office for assistance.",
            'show_sources':         False,
            'typing_indicator':     True,
        },
        'sources': {
            'use_programmes':       True,
            'use_faqs':             True,
            'use_timetable':        True,
            'use_research':         True,
            'use_scholarships':     True,
            'use_external_sources': True,
            'use_news':             True,
        },
        'security': {
            'rate_limit_enabled':       True,
            'rate_limit_per_hour':      30,
            'max_message_length':       500,
            'max_conversation_turns':   20,
            'block_off_topic':          False,
            'require_auth':             False,
        },
        'scraping': {
            'auto_scrape_enabled':   False,
            'scrape_interval_hours': 24,
            'scrape_main_site':      True,
            'scrape_research_site':  True,
            'scrape_news_site':      True,
            'last_scraped_at':       None,
            'next_scrape_at':        None,
        },
        'maintenance': {
            'maintenance_mode':    False,
            'maintenance_message': 'The AI assistant is temporarily unavailable for maintenance. Please check back shortly.',
            'disable_scraping':    False,
            'read_only_mode':      False,
        },
    }

    @classmethod
    def get_settings(cls):
        """Always returns the singleton row, creating it with defaults if absent."""
        obj, created = cls.objects.get_or_create(id=1)
        if created:
            for section, defaults in cls.DEFAULTS.items():
                setattr(obj, section, defaults.copy())
            obj.save()
        return obj

    def get_section(self, section: str) -> dict:
        """Return section dict merged with defaults so missing keys are always present."""
        defaults = self.DEFAULTS.get(section, {})
        stored   = getattr(self, section, {}) or {}
        return {**defaults, **stored}

    def update_section(self, section: str, data: dict):
        """Merge incoming data into the section and save."""
        if section not in self.DEFAULTS:
            raise ValueError(f'Unknown section: {section}')
        current = getattr(self, section, {}) or {}
        current.update(data)
        setattr(self, section, current)
        self.save(update_fields=[section, 'updated_at'])

    def __str__(self):
        return f'SystemSettings (updated {self.updated_at:%Y-%m-%d %H:%M})'