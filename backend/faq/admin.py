from django.contrib import admin
from .models import FAQ

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['question', 'answer']