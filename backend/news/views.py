import json
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import NewsPost
from .serializers import NewsPostSerializer, NewsPostListSerializer
from utils.cloudinary_upload import upload_to_cloudinary, delete_from_cloudinary


class NewsPostViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    parsers            = [MultiPartParser, FormParser, JSONParser]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['category', 'status']
    search_fields      = ['title', 'content', 'author']
    ordering_fields    = ['created_at', 'event_date']
    queryset           = NewsPost.objects.all() 

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return NewsPost.objects.all()
        return NewsPost.objects.filter(status='published')

    def get_serializer_class(self):
        if self.action == 'list':
            return NewsPostListSerializer
        return NewsPostSerializer

    def _handle_thumbnail_upload(self, file_obj):
        return upload_to_cloudinary(
            file_obj,
            folder='news/thumbnails',
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

        raw_tags = data.get('tags')
        if raw_tags and isinstance(raw_tags, str):
            try:
                data['tags'] = json.loads(raw_tags)
            except (json.JSONDecodeError, TypeError):
                data['tags'] = []

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save(created_by=request.user, thumbnail=thumbnail_data)

        return Response(
            NewsPostSerializer(post, context={'request': request}).data,
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

        raw_tags = data.get('tags')
        if raw_tags and isinstance(raw_tags, str):
            try:
                data['tags'] = json.loads(raw_tags)
            except (json.JSONDecodeError, TypeError):
                data['tags'] = []

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        return Response(
            NewsPostSerializer(post, context={'request': request}).data
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
            {'success': True, 'message': 'Post deleted successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['patch'], url_path='publish')
    def toggle_publish(self, request, pk=None):
        post        = self.get_object()
        post.status = 'draft' if post.status == 'published' else 'published'
        post.save()
        return Response({
            'success': True,
            'status':  post.status,
            'message': f"Post {'published' if post.status == 'published' else 'unpublished'} successfully"
        })

    @action(detail=False, methods=['get'], url_path='latest')
    def latest(self, request):
        """GET /api/news/posts/latest/?limit=4 — powers the homepage NewsEvents component."""
        limit      = int(request.query_params.get('limit', 4))
        posts      = NewsPost.objects.filter(status='published').order_by('-created_at')[:limit]
        serializer = NewsPostListSerializer(posts, many=True, context={'request': request})
        return Response({'success': True, 'data': serializer.data})