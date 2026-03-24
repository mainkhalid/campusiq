from django.db import models
from django.utils import timezone
from datetime import timedelta




class AISettings(models.Model):
    use_programmes       = models.BooleanField(default=True)
    use_faqs             = models.BooleanField(default=True)
    use_timetable        = models.BooleanField(default=True)
    use_research         = models.BooleanField(default=True)
    use_scholarships     = models.BooleanField(default=True)
    use_external_sources = models.BooleanField(default=True)
    fast_model           = models.CharField(max_length=255, default='arcee-ai/trinity-mini:free')
    smart_model          = models.CharField(max_length=255, default='arcee-ai/trinity-large-preview:free')
    greeting_message     = models.TextField(
        default="Hello! 👋 I'm your Zetech University assistant. How can I help you today?"
    )
    custom_system_prompt = models.TextField(blank=True, default='')
    temperature          = models.FloatField(default=0.7)
    updated_at           = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'AI Settings'
        verbose_name_plural = 'AI Settings'

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return 'AI Settings'


TOPIC_CHOICES = [
    ('programmes',   'Programmes'),
    ('fees',         'Fees'),
    ('timetable',    'Timetable'),
    ('scholarships', 'Scholarships'),
    ('admissions',   'Admissions'),
    ('research',     'Research'),
    ('general',      'General'),
]


class DailyStat(models.Model):
    """
    One row per topic per day — just a counter.
    No messages, no personal data stored.
    """
    date  = models.DateField(default=timezone.now)
    topic = models.CharField(max_length=50, choices=TOPIC_CHOICES)
    total = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('date', 'topic')
        ordering        = ['-date', 'topic']

    def __str__(self):
        return f"{self.date} | {self.topic}: {self.total}"