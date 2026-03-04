import json
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import ResearchProject, ResearchMilestone
from .serializers import (
    ResearchProjectSerializer,
    ResearchProjectListSerializer,
    ResearchMilestoneSerializer,
)
from utils.cloudinary_upload import upload_to_cloudinary, delete_from_cloudinary


class ResearchProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    parsers            = [MultiPartParser, FormParser, JSONParser]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['department', 'status', 'published']
    search_fields      = ['title', 'abstract', 'lead']
    ordering_fields    = ['created_at', 'title']
    queryset           = ResearchProject.objects.all()  # ✅ required by router

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return ResearchProject.objects.all()
        return ResearchProject.objects.filter(published=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return ResearchProjectListSerializer
        return ResearchProjectSerializer

    def _handle_thumbnail_upload(self, file_obj):
        return upload_to_cloudinary(
            file_obj,
            folder='research-projects/thumbnails',
            max_width=1200, max_height=800,
            fmt='jpg', quality='auto:good'
        )

    def create(self, request, *args, **kwargs):
        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)

        # ✅ Pop thumbnail — file object fails JSONField validation
        data.pop('thumbnail', None)

        thumbnail_data = {}
        if 'thumbnail' in request.FILES:
            try:
                thumbnail_data = self._handle_thumbnail_upload(request.FILES['thumbnail'])
            except Exception as e:
                return Response(
                    {'success': False, 'message': f'Failed to upload thumbnail: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        milestones_raw  = data.pop('milestones', None)
        milestones_data = []
        if milestones_raw:
            try:
                milestones_data = json.loads(milestones_raw) if isinstance(milestones_raw, str) else milestones_raw
            except (json.JSONDecodeError, TypeError):
                milestones_data = []

        for field in ['tags', 'collaborators']:
            raw = data.get(field)
            if raw and isinstance(raw, str):
                try:
                    data[field] = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    data[field] = []

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(created_by=request.user, thumbnail=thumbnail_data)

        if milestones_data:
            ResearchMilestone.objects.bulk_create([
                ResearchMilestone(
                    project=project,
                    description=m.get('description', ''),
                    completed=m.get('completed', False),
                    order=idx
                )
                for idx, m in enumerate(milestones_data)
                if m.get('description', '').strip()
            ])

        return Response(
            ResearchProjectSerializer(project, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial  = kwargs.pop('partial', False)
        instance = self.get_object()
        data     = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)

        # ✅ Pop thumbnail before serializer validation
        data.pop('thumbnail', None)

        if 'thumbnail' in request.FILES:
            if instance.thumbnail and instance.thumbnail.get('public_id'):
                try:
                    delete_from_cloudinary(instance.thumbnail['public_id'])
                except Exception as e:
                    print(f'Warning: failed to delete old thumbnail: {e}')
            try:
                data['thumbnail'] = self._handle_thumbnail_upload(request.FILES['thumbnail'])
            except Exception as e:
                return Response(
                    {'success': False, 'message': f'Failed to upload thumbnail: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        for field in ['tags', 'collaborators']:
            raw = data.get(field)
            if raw and isinstance(raw, str):
                try:
                    data[field] = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    data[field] = []

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        return Response(
            ResearchProjectSerializer(project, context={'request': request}).data
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.thumbnail and instance.thumbnail.get('public_id'):
            try:
                delete_from_cloudinary(instance.thumbnail['public_id'])
            except Exception as e:
                print(f'Warning: failed to delete thumbnail: {e}')
        instance.delete()
        return Response(
            {'success': True, 'message': 'Research project deleted successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['patch'], url_path='publish')
    def toggle_publish(self, request, pk=None):
        project           = self.get_object()
        project.published = not project.published
        project.save()
        return Response({
            'success':   True,
            'message':   f"Project {'published' if project.published else 'unpublished'} successfully",
            'published': project.published
        })

    @action(detail=False, methods=['get'], url_path='active')
    def active(self, request):
        projects   = ResearchProject.objects.filter(published=True)
        serializer = ResearchProjectListSerializer(projects, many=True, context={'request': request})
        return Response({'success': True, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='by-department')
    def by_department(self, request):
        department = request.query_params.get('department')
        qs         = self.get_queryset()
        if department:
            qs = qs.filter(department=department)
        serializer = ResearchProjectListSerializer(qs, many=True, context={'request': request})
        return Response({'success': True, 'data': serializer.data})


class ResearchMilestoneViewSet(viewsets.ModelViewSet):
    serializer_class   = ResearchMilestoneSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset           = ResearchMilestone.objects.all()  # ✅ required by router

    def get_queryset(self):
        return ResearchMilestone.objects.filter(project_id=self.kwargs['project_pk'])

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['project_pk'])

    @action(detail=True, methods=['patch'], url_path='toggle')
    def toggle_completed(self, request, pk=None, project_pk=None):
        milestone           = self.get_object()
        milestone.completed = not milestone.completed
        milestone.save()
        return Response({'success': True, 'completed': milestone.completed})