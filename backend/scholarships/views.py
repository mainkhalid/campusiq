import json
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Scholarship
from .serializers import ScholarshipSerializer, ScholarshipListSerializer
from utils.cloudinary_upload import upload_to_cloudinary, delete_from_cloudinary


class ScholarshipViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    parsers = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['eligibility', 'published', 'applications_open']
    search_fields = ['name', 'provider', 'description']
    ordering_fields = ['deadline', 'created_at', 'name']

    queryset = Scholarship.objects.all()  # required by router

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Scholarship.objects.all()
        return Scholarship.objects.filter(published=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return ScholarshipListSerializer
        return ScholarshipSerializer

    def _handle_thumbnail_upload(self, file_obj):
        """
        Uploads thumbnail to Cloudinary.
        Mirrors the uploadToCloudinary() block in scholarshipController.js.
        """
        return upload_to_cloudinary(
            file_obj,
            folder='scholarships/thumbnails',
            max_width=1200,
            max_height=800,
            fmt='jpg',
            quality='auto:good'
        )

    def _parse_array_field(self, value):
        """
        Mirrors parseArrayField() in scholarshipController.js.
        Handles JSON string, plain string, or list input.
        """
        if not value:
            return []
        if isinstance(value, list):
            return [str(v).strip() for v in value if str(v).strip()]
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(v).strip() for v in parsed if str(v).strip()]
            except (json.JSONDecodeError, TypeError):
                # Split by newline, semicolon, or pipe — mirrors JS fallback
                import re
                return [
                    v.strip() for v in re.split(r'\n|;|\|', value)
                    if v.strip()
                ]
        return []

    def create(self, request, *args, **kwargs):
        """
        Handles POST /api/scholarships/scholarships/
        Mirrors createScholarship() in scholarshipController.js.
        """
        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)

        # Parse array fields
        data['requirements'] = self._parse_array_field(data.get('requirements'))
        data['tags'] = self._parse_array_field(data.get('tags'))

        # Remove thumbnail from data — it's a file, not JSON.
        # We handle it separately and inject via serializer.save()
        data.pop('thumbnail', None)

        # Handle thumbnail upload
        thumbnail_data = {}
        if 'thumbnail' in request.FILES:
            try:
                thumbnail_data = self._handle_thumbnail_upload(
                    request.FILES['thumbnail']
                )
            except Exception as e:
                return Response(
                    {'success': False, 'message': f'Failed to upload thumbnail: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        scholarship = serializer.save(
            created_by=request.user,
            thumbnail=thumbnail_data
        )

        return Response(
            ScholarshipSerializer(scholarship, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    

    def update(self, request, *args, **kwargs):
        """
        Handles PUT/PATCH /api/scholarships/scholarships/{id}/
        Mirrors updateScholarship() in scholarshipController.js.
        Replaces old Cloudinary image if a new file is uploaded.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)

        # Remove thumbnail from data before serializer validation
        # File objects are not valid JSON — handled separately below
        data.pop('thumbnail', None)

        # Parse array fields if being updated
        if 'requirements' in data:
            data['requirements'] = self._parse_array_field(data['requirements'])
        if 'tags' in data:
            data['tags'] = self._parse_array_field(data['tags'])

        # Handle thumbnail replacement
        if 'thumbnail' in request.FILES:
            # Delete old thumbnail from Cloudinary
            # Mirrors: await deleteFromCloudinary(scholarship.thumbnail.publicId)
            if instance.thumbnail and instance.thumbnail.get('public_id'):
                try:
                    delete_from_cloudinary(instance.thumbnail['public_id'])
                except Exception as e:
                    print(f'Warning: failed to delete old thumbnail: {e}')

            # Upload new thumbnail
            try:
                data['thumbnail'] = self._handle_thumbnail_upload(
                    request.FILES['thumbnail']
                )
            except Exception as e:
                return Response(
                    {'success': False, 'message': f'Failed to upload thumbnail: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        scholarship = serializer.save()

        return Response(
            ScholarshipSerializer(scholarship, context={'request': request}).data
        )

    def destroy(self, request, *args, **kwargs):
        """
        Handles DELETE /api/scholarships/scholarships/{id}/
        Mirrors deleteScholarship() in scholarshipController.js.
        Deletes Cloudinary image before removing DB record.
        """
        instance = self.get_object()

        if instance.thumbnail and instance.thumbnail.get('public_id'):
            try:
                delete_from_cloudinary(instance.thumbnail['public_id'])
            except Exception as e:
                print(f'Warning: failed to delete thumbnail from Cloudinary: {e}')

        instance.delete()
        return Response(
            {'success': True, 'message': 'Scholarship deleted successfully'},
            status=status.HTTP_200_OK
        )

    # ── Custom actions ──────────────────────────────────────

    @action(detail=True, methods=['patch'], url_path='publish')
    def toggle_publish(self, request, pk=None):
        """PATCH /api/scholarships/scholarships/{id}/publish/"""
        scholarship = self.get_object()
        if scholarship.published:
            scholarship.unpublish()
            message = 'Scholarship unpublished successfully'
        else:
            scholarship.publish()
            message = 'Scholarship published successfully'

        return Response({
            'success': True,
            'message': message,
            'published': scholarship.published,
            'published_at': scholarship.published_at
        })

    @action(detail=True, methods=['patch'], url_path='toggle-applications')
    def toggle_applications(self, request, pk=None):
        """PATCH /api/scholarships/scholarships/{id}/toggle-applications/"""
        scholarship = self.get_object()
        if scholarship.applications_open:
            scholarship.close_applications()
            message = 'Applications closed successfully'
        else:
            scholarship.open_applications()
            message = 'Applications opened successfully'

        return Response({
            'success': True,
            'message': message,
            'applications_open': scholarship.applications_open
        })

    @action(detail=False, methods=['get'], url_path='active')
    def active(self, request):
        """
        GET /api/scholarships/scholarships/active/
        Mirrors findActive() static method from Scholarship.js
        """
        today = timezone.now().date()
        scholarships = Scholarship.objects.filter(
            published=True,
            applications_open=True,
            deadline__gte=today
        ).order_by('deadline')

        serializer = ScholarshipListSerializer(
            scholarships, many=True, context={'request': request}
        )
        return Response({'success': True, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='expiring-soon')
    def expiring_soon(self, request):
        """
        GET /api/scholarships/scholarships/expiring-soon/?days=7
        Mirrors findExpiringSoon() static method from Scholarship.js
        """
        days = int(request.query_params.get('days', 7))
        today = timezone.now().date()
        future = today + timezone.timedelta(days=days)

        scholarships = Scholarship.objects.filter(
            published=True,
            applications_open=True,
            deadline__gte=today,
            deadline__lte=future
        ).order_by('deadline')

        serializer = ScholarshipListSerializer(
            scholarships, many=True, context={'request': request}
        )
        return Response({'success': True, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='by-eligibility')
    def by_eligibility(self, request):
        """GET /api/scholarships/scholarships/by-eligibility/?eligibility=STEM+Students"""
        eligibility = request.query_params.get('eligibility')
        qs = Scholarship.objects.filter(published=True, applications_open=True)
        if eligibility:
            qs = qs.filter(eligibility=eligibility)
        serializer = ScholarshipListSerializer(
            qs, many=True, context={'request': request}
        )
        return Response({'success': True, 'data': serializer.data})