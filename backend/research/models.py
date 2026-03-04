from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.conf import settings


class ResearchProject(models.Model):
    DEPARTMENT_CHOICES = [
        ('Sciences', 'School of Sciences'),
        ('Tech', 'Information Technology'),
        ('Health', 'Health Sciences'),
        ('Arts', 'Humanities & Arts'),
    ]
    STATUS_CHOICES = [
        ('Planning', 'Planning Phase'),
        ('Active', 'Active Research'),
        ('Peer Review', 'Under Peer Review'),
        ('Completed', 'Completed / Published'),
    ]

    title = models.CharField(max_length=255)
    lead = models.CharField(max_length=255)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    funding = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Planning')
    abstract = models.TextField(blank=True)
    published = models.BooleanField(default=False, db_index=True)

    tags = ArrayField(
        models.CharField(max_length=100),
        blank=True, default=list
    )
    collaborators = ArrayField(
        models.CharField(max_length=255),
        blank=True, default=list
    )

    # JSONField instead of ImageField — stores Cloudinary response dict:
    # { url, public_id, width, height, format, bytes }
    # Matches exactly the shape returned by upload_to_cloudinary()
    # and mirrors your Node thumbnail: { url, publicId, ... } structure.
    thumbnail = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='research_projects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['department']),
            models.Index(fields=['published']),
        ]

    def __str__(self):
        return self.title


class ResearchMilestone(models.Model):
    project = models.ForeignKey(
        ResearchProject,
        on_delete=models.CASCADE,
        related_name='milestones'
    )
    description = models.TextField()
    completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.project.title} — {self.description[:50]}"