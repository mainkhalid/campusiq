from rest_framework import serializers
from .models import Milestone

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = '__all__'  # or list specific fields: ['id', 'year', 'title', ...]