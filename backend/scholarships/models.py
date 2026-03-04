from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.conf import settings
from django.utils import timezone


class Scholarship(models.Model):
    ELIGIBILITY_CHOICES = [
        ('Open to All', 'Open to All'),
        ('Undergraduate Only', 'Undergraduate Only'),
        ('Graduate Only', 'Graduate Only'),
        ('International Students', 'International Students'),
        ('Domestic Students Only', 'Domestic Students Only'),
        ('STEM Students', 'STEM Students'),
        ('Arts & Humanities', 'Arts & Humanities'),
        ('First Year Students', 'First Year Students'),
        ('Final Year Students', 'Final Year Students'),
        ('Need-Based', 'Need-Based'),
        ('Merit-Based', 'Merit-Based'),
    ]

    name = models.CharField(max_length=200)
    provider = models.CharField(max_length=255)
    amount = models.CharField(max_length=100)
    deadline = models.DateField(db_index=True)
    eligibility = models.CharField(
        max_length=50,
        choices=ELIGIBILITY_CHOICES,
        default='Open to All',
        db_index=True
    )
    description = models.TextField()
    requirements = ArrayField(
        models.CharField(max_length=500),
        blank=True, default=list
    )
    tags = ArrayField(
        models.CharField(max_length=100),
        blank=True, default=list
    )

    # JSONField stores Cloudinary response:
    # { url, public_id, width, height, format, bytes }
    thumbnail = models.JSONField(default=dict, blank=True)

    published = models.BooleanField(default=False, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    applications_open = models.BooleanField(default=True, db_index=True)
    application_url = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='scholarships'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['deadline']
        indexes = [
            models.Index(fields=['published', 'applications_open']),
            models.Index(fields=['deadline']),
        ]

    def __str__(self):
        return self.name

    def publish(self):
        self.published = True
        self.published_at = timezone.now()
        self.save()

    def unpublish(self):
        self.published = False
        self.published_at = None
        self.save()

    def open_applications(self):
        self.applications_open = True
        self.save()

    def close_applications(self):
        self.applications_open = False
        self.save()