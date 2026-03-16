from rest_framework import serializers
from .models import Timetable, Session


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model   = Session
        exclude = ['timetable']


class TimetableSerializer(serializers.ModelSerializer):
    sessions = SessionSerializer(many=True, read_only=True)

    class Meta:
        model  = Timetable
        fields = '__all__'


class TimetableListSerializer(serializers.ModelSerializer):
    """Lightweight — no sessions array for list views."""
    session_count = serializers.SerializerMethodField()

    def get_session_count(self, obj):
        return obj.sessions.count()

    class Meta:
        model   = Timetable
        exclude = ['metadata']