from rest_framework import serializers
from .models import Scholarship


class ScholarshipSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()
    thumbnail = serializers.JSONField(required=False, default=dict)

    def get_thumbnail_url(self, obj):
        # thumbnail is a JSONField dict: { url, public_id, ... }
        # NOT an ImageField — no .url attribute needed
        if obj.thumbnail and isinstance(obj.thumbnail, dict):
            return obj.thumbnail.get('url', '')
        return None

    class Meta:
        model  = Scholarship
        fields = '__all__'


class ScholarshipListSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()

    def get_thumbnail_url(self, obj):
        if obj.thumbnail and isinstance(obj.thumbnail, dict):
            return obj.thumbnail.get('url', '')
        return None

    class Meta:
        model  = Scholarship
        fields = [
            'id', 'name', 'provider', 'amount', 'deadline',
            'eligibility', 'published', 'applications_open',
            'tags', 'thumbnail_url', 'created_at'
        ]