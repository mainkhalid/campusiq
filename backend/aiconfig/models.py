from django.db import models


class ChatLog(models.Model):
    """
    One row per student message. No personal data, no full conversation.
    Just enough for the admin to see what topics students ask about
    and whether the bot was able to help.
    """
    TOPIC_CHOICES = [
        ('programmes',   'Programmes'),
        ('timetable',    'Timetable'),
        ('admissions',   'Admissions'),
        ('fees',         'Fees'),
        ('scholarships', 'Scholarships'),
        ('research',     'Research'),
        ('general',      'General'),
        ('unknown',      'Unknown'),
    ]

    topic                 = models.CharField(max_length=20, choices=TOPIC_CHOICES, default='unknown', db_index=True)
    message               = models.TextField()           # student question, capped at 500 chars in service
    response              = models.TextField(blank=True)  # bot reply preview, capped at 800 chars
    was_helpful           = models.BooleanField(default=False)
    had_timetable_results = models.BooleanField(default=False)
    had_programme_results = models.BooleanField(default=False)
    created_at            = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.topic}] {self.message[:60]}"


class AISettings(models.Model):
    """
    Singleton — only one row, pk=1.
    Admin edits via AIAdmin panel → service reads on every request.
    Changes take effect on the very next student message.
    """
    # Data source toggles — bot skips the DB query if disabled
    use_programmes   = models.BooleanField(default=True)
    use_faqs         = models.BooleanField(default=True)
    use_timetable    = models.BooleanField(default=True)
    use_research     = models.BooleanField(default=True)
    use_scholarships = models.BooleanField(default=True)
    use_external_sources = models.BooleanField(default=True)

    # First message the widget shows when a student opens the chat
    greeting_message = models.TextField(
        default="Hello! 👋 I'm your Zetech University assistant. How can I help you today?"
    )

    # Admin extra instructions injected at the top of the system prompt.
    # Examples: "Always respond in English and Swahili"
    #           "Promote ICT school when relevant"
    #           "Do not discuss competitor universities"
    custom_system_prompt = models.TextField(blank=True)

    # Controls creativity vs accuracy of LLM responses
    temperature = models.FloatField(default=0.7)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Settings'

    def __str__(self):
        return f"AI Settings (updated {self.updated_at.strftime('%Y-%m-%d')})"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj