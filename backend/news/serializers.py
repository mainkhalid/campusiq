from rest_framework import serializers
from .models import NewsPost


class NewsPostSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()
    thumbnail     = serializers.JSONField(required=False, default=dict)

    def get_thumbnail_url(self, obj):
        if obj.thumbnail and isinstance(obj.thumbnail, dict):
            return obj.thumbnail.get('url', '')
        return None

    class Meta:
        model  = NewsPost
        fields = '__all__' 


class NewsPostListSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()
 
    def get_thumbnail_url(self, obj):
        if obj.thumbnail and isinstance(obj.thumbnail, dict):
            return obj.thumbnail.get('url', '')
        return None

    class Meta:
        model  = NewsPost
        fields = [
            'id', 'title', 'category', 'status',
            'author', 'event_date', 'tags',
            'external_link', 'thumbnail_url',
            'created_at'
        ]