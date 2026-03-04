from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.conf import settings


class NewsPost(models.Model):
    CATEGORY_CHOICES = [
        ('news', 'News'),
        ('event', 'Event'),
        ('announcement', 'Announcement'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES,
        default='news', db_index=True
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        default='draft', db_index=True
    )
   
    event_date = models.DateField(null=True, blank=True)
    author = models.CharField(max_length=255, blank=True)
    tags = ArrayField(
        models.CharField(max_length=100),
        blank=True, default=list
    )
    external_link = models.URLField(blank=True)
    thumbnail = models.ImageField(
        upload_to='news/thumbnails/',
        blank=True, null=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='news_posts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'category']),
        ]

    def __str__(self):
        return self.title