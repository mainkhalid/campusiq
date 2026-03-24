import threading
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import CrawlSource, CrawlChunk
from .serializers import CrawlSourceSerializer, CrawlSourceCreateSerializer
from .crawler_service import crawl_website, extract_pdf


def _run_crawl(source_id: int):
    """
    Run in a background thread so the API response returns immediately.
    Updates source status + chunk_count when done.
    """
    try:
        source        = CrawlSource.objects.get(id=source_id)
        source.status = 'crawling' if source.source_type != 'pdf' else 'processing'
        source.save(update_fields=['status'])

        if source.source_type == 'pdf':
            count, error = extract_pdf(source)
        else:
            count, error = crawl_website(source)

        if error:
            source.status        = 'failed'
            source.error_message = error
        else:
            source.status        = 'indexed'
            source.error_message = ''
            source.chunk_count   = count
            source.last_crawled  = timezone.now()

        source.save(update_fields=['status', 'error_message', 'chunk_count', 'last_crawled'])

    except CrawlSource.DoesNotExist:
        pass
    except Exception as e:
        try:
            source = CrawlSource.objects.get(id=source_id)
            source.status        = 'failed'
            source.error_message = str(e)
            source.save(update_fields=['status', 'error_message'])
        except Exception:
            pass


class CrawlSourceViewSet(viewsets.ModelViewSet):
    queryset             = CrawlSource.objects.all()
    permission_classes   = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ('create',):
            return CrawlSourceCreateSerializer
        return CrawlSourceSerializer

    def create(self, request, *args, **kwargs):
        serializer = CrawlSourceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data        = serializer.validated_data
        source_type = data.get('source_type', 'website')
        pdf_file    = data.pop('pdf_file', None)

        source = CrawlSource.objects.create(
            **data,
            created_by  = request.user,
            pdf_filename = pdf_file.name if pdf_file else '',
        )

        if pdf_file:
            source.pdf_file = pdf_file
            source.save(update_fields=['pdf_file', 'pdf_filename'])

        # Kick off indexing in background immediately after creation
        thread = threading.Thread(target=_run_crawl, args=(source.id,), daemon=True)
        thread.start()

        return Response(CrawlSourceSerializer(source).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        source = self.get_object()
        source.delete_pdf_file()
        source.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def crawl(self, request, pk=None):
        """Manually trigger a re-crawl / re-index."""
        source = self.get_object()

        if source.status in ('crawling', 'processing'):
            return Response(
                {'detail': 'Already crawling. Please wait.'},
                status=status.HTTP_409_CONFLICT
            )

        thread = threading.Thread(target=_run_crawl, args=(source.id,), daemon=True)
        thread.start()

        return Response({
            'detail': f'Started {"processing" if source.source_type == "pdf" else "crawling"} "{source.name}".',
            'status': 'crawling',
        })

 
    @action(detail=True, methods=['patch'])
    def toggle(self, request, pk=None):
        """Toggle active/inactive without affecting chunks."""
        source        = self.get_object()
        source.active = not source.active
        source.save(update_fields=['active'])
        return Response({
            'active':  source.active,
            'detail':  f'Source {"activated" if source.active else "deactivated"}.',
        })

    @action(detail=True, methods=['get'])
    def chunks(self, request, pk=None):
        """Preview first 10 chunks — useful for debugging."""
        source = self.get_object()
        chunks = source.chunks.all()[:10].values('id', 'content', 'page_title', 'page_url')
        return Response(list(chunks))