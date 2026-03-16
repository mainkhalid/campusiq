from django.db import models


class Timetable(models.Model):
    STATUS_CHOICES = [
        ('published', 'Published'),
        ('draft',     'Draft'),
        ('archived',  'Archived'),
    ]

    school        = models.CharField(max_length=100, db_index=True)
    school_name   = models.CharField(max_length=255)
    academic_year = models.CharField(max_length=20, db_index=True)
    semester      = models.CharField(max_length=50, db_index=True)  # Jan-April | May-Aug | Sept-Dec
    campus        = models.CharField(max_length=100, blank=True, default='')
    file_name     = models.CharField(max_length=255)
    file_size     = models.PositiveIntegerField(null=True, blank=True)
    notes         = models.TextField(blank=True, default='')
    status        = models.CharField(max_length=10, choices=STATUS_CHOICES, default='published', db_index=True)
    version       = models.PositiveIntegerField(default=1)
    uploaded_by   = models.CharField(max_length=255, default='admin')
    upload_date   = models.DateTimeField(auto_now_add=True)
    metadata      = models.JSONField(default=dict, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['school', 'academic_year', 'semester', 'status']),
            models.Index(fields=['campus', 'semester', 'status']),
        ]
        ordering = ['-upload_date']

    def __str__(self):
        return f"{self.school_name} — {self.academic_year} {self.semester}"


class Session(models.Model):
    DAY_CHOICES = [
        ('Monday',    'Monday'),
        ('Tuesday',   'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday',  'Thursday'),
        ('Friday',    'Friday'),
        ('Saturday',  'Saturday'),
        ('Sunday',    'Sunday'),
    ]

    timetable  = models.ForeignKey(Timetable, on_delete=models.CASCADE, related_name='sessions')

    # Programme block e.g. "BBAM Y1S1", "BBAM Y3S1 ACCOUNTING", "DAC SEM1"
    # Parsed directly from the Excel file — stored as-is for chatbot queries
    programme  = models.CharField(max_length=120, blank=True, default='', db_index=True)

    # programme_code e.g. "BBAM", "DAC", "BSCIT" — for filtering
    programme_code = models.CharField(max_length=20, blank=True, default='', db_index=True)

    unit_code  = models.CharField(max_length=20, db_index=True)
    unit_title = models.CharField(max_length=255, default='N/A')
    lec_name   = models.CharField(max_length=255, default='Staff', db_index=True)
    day        = models.CharField(max_length=10, choices=DAY_CHOICES, db_index=True)
    start_time = models.CharField(max_length=10)
    end_time   = models.CharField(max_length=10)
    room       = models.CharField(max_length=50, default='ONLINE', db_index=True)

    class Meta:
        ordering = ['day', 'start_time']
        indexes  = [
            models.Index(fields=['unit_code']),
            models.Index(fields=['room']),
            models.Index(fields=['lec_name']),
            models.Index(fields=['programme']),
            models.Index(fields=['programme_code']),
            models.Index(fields=['timetable', 'day']),
        ]

    def __str__(self):
        return f"{self.programme} | {self.unit_code} — {self.day} {self.start_time}"