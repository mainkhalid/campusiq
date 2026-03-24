# programmes/views.py
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from .models import Programme
from .serializers import ProgrammeSerializer, ProgrammeListSerializer

class ProgrammeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['school', 'level', 'is_active']
    search_fields = ['name', 'description', 'code']
    ordering_fields = ['name', 'level', 'created_at']

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Programme.objects.all()
        return Programme.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return ProgrammeListSerializer
        return ProgrammeSerializer

    @action(detail=False, methods=['get'], url_path='by-school')
    def by_school(self, request):
        school = request.query_params.get('school')
        qs = self.get_queryset().filter(school=school) if school else self.get_queryset()
        serializer = ProgrammeListSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='by-level')
    def by_level(self, request):
        level = request.query_params.get('level')
        qs = self.get_queryset().filter(level=level) if level else self.get_queryset()
        serializer = ProgrammeListSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Replaces your /programmes/stats Express route."""
        from django.db.models import Count
        qs = Programme.objects.filter(is_active=True)
        return Response({
            'success': True,
            'data': {
                'total': qs.count(),
                'by_school': list(qs.values('school').annotate(count=Count('id'))),
                'by_level': list(qs.values('level').annotate(count=Count('id'))),
            }
        })