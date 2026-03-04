from rest_framework import serializers
from .models import ResearchProject, ResearchMilestone


class ResearchMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model   = ResearchMilestone
        exclude = ['project']


class ResearchProjectSerializer(serializers.ModelSerializer):
    milestones    = ResearchMilestoneSerializer(many=True, read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    thumbnail     = serializers.JSONField(required=False, default=dict)

    def get_thumbnail_url(self, obj):
        if obj.thumbnail and isinstance(obj.thumbnail, dict):
            return obj.thumbnail.get('url', '')
        return None

    class Meta:
        model  = ResearchProject
        fields = '__all__'  # includes thumbnail since it's on the model


class ResearchProjectListSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()
    # ✅ No thumbnail field declaration here — not in fields list so don't declare it
    # thumbnail_url is all we need for list views

    def get_thumbnail_url(self, obj):
        if obj.thumbnail and isinstance(obj.thumbnail, dict):
            return obj.thumbnail.get('url', '')
        return None

    class Meta:
        model  = ResearchProject
        fields = [
            'id', 'title', 'lead', 'department',
            'status', 'published', 'tags',
            'thumbnail_url', 'created_at'
        ]