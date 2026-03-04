from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class CrawlSource(models.Model):

    SOURCE_TYPES = [
        ('website', 'Website URL'),
        ('sitemap', 'Sitemap URL'),
        ('pdf',     'PDF Document'),
    ]
    STATUS_CHOICES = [
        ('pending',    'Pending'),
        ('crawling',   'Crawling'),
        ('processing', 'Processing'),
        ('indexed',    'Indexed'),
        ('failed',     'Failed'),
    ]

    name         = models.CharField(max_length=255)
    source_type  = models.CharField(max_length=20, choices=SOURCE_TYPES, default='website')

    # Website / sitemap fields
    url          = models.URLField(blank=True, default='')
    crawl_depth  = models.IntegerField(default=1)          # how many link levels to follow

    # PDF fields — store file path only, we delete after extraction
    pdf_file     = models.FileField(upload_to='crawler_pdfs/', blank=True, null=True)
    pdf_filename = models.CharField(max_length=255, blank=True) # original filename for display

    # State
    active        = models.BooleanField(default=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    chunk_count   = models.IntegerField(default=0)
    last_crawled  = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.source_type})'

    def delete_pdf_file(self):
        """Delete the physical PDF after text has been extracted — only chunks needed."""
        if self.pdf_file:
            try:
                import os
                if os.path.isfile(self.pdf_file.path):
                    os.remove(self.pdf_file.path)
                self.pdf_file = None
                self.save(update_fields=['pdf_file'])
            except Exception as e:
                print(f'Warning: could not delete PDF file: {e}')


class CrawlChunk(models.Model):
    """
    A single chunk of text extracted from a CrawlSource.
    Each chunk gets its own embedding vector stored as a JSON array.
    At query time we do cosine similarity in Python across active chunks.
    """
    source    = models.ForeignKey(
        CrawlSource, on_delete=models.CASCADE, related_name='chunks'
    )
    content   = models.TextField()                  # raw extracted text chunk
    page_url  = models.URLField(blank=True)         # which page/section it came from
    page_title = models.CharField(max_length=500, blank=True)
    embedding = models.JSONField(default=list)      # float list from embedding model
    metadata  = models.JSONField(default=dict)      # chunk_index, page_num, section, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['source', 'id']

    def __str__(self):
        return f'Chunk {self.id} — {self.source.name} ({len(self.content)} chars)'