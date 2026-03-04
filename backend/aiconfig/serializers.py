from rest_framework import serializers
from .models import ChatLog, AISettings


class ChatLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ChatLog
        fields = '__all__'


class AISettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AISettings
        fields = '__all__'