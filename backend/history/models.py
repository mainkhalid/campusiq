# history/models.py
from django.db import models

class Milestone(models.Model):
    # CharField = short text (like String in Mongoose)
    year = models.CharField(max_length=4)
    title = models.CharField(max_length=255)
    desc = models.TextField()  # TextField = long text
    
    # choices= enforces an enum at the DB level
    ICON_CHOICES = [
        ('MdLocationCity', 'Campus/Location'),
        ('MdFlag', 'Foundation/Goal'),
        ('MdHistoryEdu', 'Charter/Academic'),
        ('MdEmojiEvents', 'Award/Achievement'),
    ]
    icon = models.CharField(max_length=50, choices=ICON_CHOICES, default='MdFlag')
    
    CATEGORY_CHOICES = [
        ('establishment', 'Establishment'),
        ('infrastructure', 'Infrastructure'),
        ('accreditation', 'Accreditation'),
        ('academic', 'Academic'),
        ('achievement', 'Achievement'),
        ('partnership', 'Partnership'),
    ]
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    
    SIGNIFICANCE_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
    significance = models.CharField(max_length=10, choices=SIGNIFICANCE_CHOICES, default='medium')
    
    # Django auto-adds 'id' as primary key — no need to define it
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-year']  # Default sort: newest first

    def __str__(self):
        return f"{self.year} — {self.title}"