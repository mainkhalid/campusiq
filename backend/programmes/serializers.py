from rest_framework import serializers
from .models import Programme

class ProgrammeSerializer(serializers.ModelSerializer):
    total_programme_cost = serializers.ReadOnlyField()
    total_credits = serializers.ReadOnlyField()

    class Meta:
        model = Programme
        fields = '__all__'


class ProgrammeListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views.
    The AI bot and AcademicsPage only need a subset of fields —
    no point sending units[] and fee_structure[] JSON blobs
    in a list of 50 programmes.
    """
    class Meta:
        model = Programme
        fields = [
            'id', 'name', 'code', 'school', 'level',
            'mean_grade', 'campuses', 'modes',
            'description', 'goal', 'careers',
            'study_mode', 'duration_years',
            'duration_semesters', 'is_active',
            'entry_requirements',
            'fee_structure',
            'fee_per_semester',   
            'semesters',
            'total_programme_cost',
        ]