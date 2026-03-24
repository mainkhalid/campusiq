from django.db import models
from django.contrib.postgres.fields import ArrayField

class Programme(models.Model):
    SCHOOL_CHOICES = [
        ('ict', 'ICT'),
        ('business', 'Business'),
        ('engineering', 'Engineering'),
        ('health', 'Health'),
        ('education', 'Education'),
    ]
    LEVEL_CHOICES = [
        ('Certificate', 'Certificate'),
        ('Diploma', 'Diploma'),
        ('Degree', 'Degree'),
        ('Masters', 'Masters'),
        ('Doctorate', 'Doctorate'),
        ('Professional Certification', 'Professional Certification'),
    ]
    STUDY_MODE_OPTIONS = [
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('E-Learning', 'E-Learning'),
        ('Evening', 'Evening'),
        ('Weekend', 'Weekend'),
    ]
    INTAKE_MONTHS = [
        ('January', 'January'),
        ('May', 'May'),
        ('September', 'September'),
    ]

    name = models.CharField(max_length=255, db_index=True)
    code = models.CharField(max_length=20, blank=True, null=True, default=None)
    school = models.CharField(max_length=50, choices=SCHOOL_CHOICES, db_index=True)
    level = models.CharField(max_length=50, choices=LEVEL_CHOICES, db_index=True)
    mean_grade = models.CharField(max_length=10, blank=True)
    campuses = models.CharField(max_length=255, blank=True)
    modes = models.CharField(
        max_length=255,
        default='Full time, Part time, E-Learning',
        blank=True
    )
    description = models.TextField(blank=True)
    goal = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    duration_years = models.PositiveIntegerField(null=True, blank=True)
    duration_semesters = models.PositiveIntegerField(null=True, blank=True)

    fee_per_semester = models.PositiveIntegerField(null=True, blank=True)
    semesters = models.PositiveIntegerField(null=True, blank=True)

    careers = ArrayField(
        models.CharField(max_length=255),
        blank=True, default=list
    )
    intake_months = ArrayField(
        models.CharField(max_length=20, choices=INTAKE_MONTHS),
        blank=True, default=list
    )
    study_mode = ArrayField(
        models.CharField(max_length=20),
        blank=True, default=list
    )
    accreditation = ArrayField(
        models.CharField(max_length=255),
        blank=True, default=list
    )
    highlights = ArrayField(
        models.CharField(max_length=255),
        blank=True, default=list
    )

    units = models.JSONField(default=list, blank=True)
    fee_structure = models.JSONField(default=list, blank=True)
    career_paths = models.JSONField(default=list, blank=True)
    entry_requirements = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['school', 'level']),
            models.Index(fields=['level', 'is_active']),
        ]

    def __str__(self):
        return f"{self.code} — {self.name}"

    @property
    def total_programme_cost(self):
        if not self.fee_structure:
            return 0
        return sum(fee.get('totalFee', 0) for fee in self.fee_structure)

    @property
    def total_credits(self):
        if not self.units:
            return 0
        return sum(unit.get('credits', 0) for unit in self.units)