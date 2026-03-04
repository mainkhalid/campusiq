from django.db import models

class Timetable(models.Model):
    STATUS_CHOICES = [
        ('published', 'Published'),
        ('draft', 'Draft'),
        ('archived', 'Archived'),
    ]

    school = models.CharField(max_length=100, db_index=True)
    school_name = models.CharField(max_length=255)
    academic_year = models.CharField(max_length=20, db_index=True)
    semester = models.CharField(max_length=50, db_index=True)
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='published',
        db_index=True
    )
    version = models.PositiveIntegerField(default=1)
    uploaded_by = models.CharField(max_length=255, default='admin')
    upload_date = models.DateTimeField(auto_now_add=True)

    # metadata is never queried at field level — always fetched
    # as a whole object — so JSONField is the right choice here.
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Matches your Mongoose compound index — makes
        # findBySchoolAndPeriod queries fast
        indexes = [
            models.Index(fields=['school', 'academic_year', 'semester', 'status']),
        ]
        ordering = ['-upload_date']

    def __str__(self):
        return f"{self.school_name} — {self.academic_year} {self.semester}"


class Session(models.Model):
    """
    Separate table for sessions because the AI bot queries
    inside them: by unitCode, by lecName, by room.
    A JSONField would make those queries messy or impossible.
    
    ForeignKey with on_delete=CASCADE means: when a Timetable
    is deleted, all its Sessions are automatically deleted too.
    related_name='sessions' lets you do timetable.sessions.all()
    — mirrors your Mongoose sessions[] sub-document pattern.
    """
    DAY_CHOICES = [
        ('Monday', 'Monday'), ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'), ('Thursday', 'Thursday'),
        ('Friday', 'Friday'), ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]

    timetable = models.ForeignKey(
        Timetable,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    unit_code = models.CharField(max_length=20, db_index=True)
    unit_title = models.CharField(max_length=255, default='N/A')
    lec_name = models.CharField(max_length=255, default='Staff', db_index=True)
    day = models.CharField(max_length=10, choices=DAY_CHOICES, db_index=True)
    start_time = models.CharField(max_length=10)
    end_time = models.CharField(max_length=10)
    room = models.CharField(max_length=50, default='ONLINE', db_index=True)

    class Meta:
        ordering = ['day', 'start_time']
        # Speeds up the bot's most common queries
        indexes = [
            models.Index(fields=['unit_code']),
            models.Index(fields=['room']),
            models.Index(fields=['lec_name']),
            models.Index(fields=['timetable', 'day']),
        ]

    def __str__(self):
        return f"{self.unit_code} — {self.day} {self.start_time}"