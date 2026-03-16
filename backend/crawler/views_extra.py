"""
crawler/views_extra.py

Additional views that complement the CrawlSourceViewSet.

POST /api/crawler/run-all/
    Triggers a crawl of every active, non-PDF, non-busy source.
    Used by the AIAdmin "Crawl All Now" button.
    Returns immediately — crawls run in background threads.

GET /api/crawler/status/
    Returns a lightweight status summary: counts by status, last_crawled timestamps.
    Used by the AIAdmin to show crawl health at a glance.
"""
import threading
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import CrawlSource
from .views import _run_crawl


class RunAllCrawlsView(APIView):
    """
    POST /api/crawler/run-all/

    Fires a background crawl for every active website source that
    isn't currently crawling. Respects maintenance.disable_scraping.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Respect maintenance / disable_scraping flag
        try:
            from settings_app.models import SystemSettings
            obj         = SystemSettings.get_settings()
            maintenance = obj.get_section('maintenance')
            if maintenance.get('disable_scraping', False):
                return Response(
                    {'error': 'Scraping is disabled in maintenance settings.'},
                    status=503
                )
        except Exception:
            pass  # settings_app not installed — proceed

        sources = CrawlSource.objects.filter(
            active=True,
            source_type='website',
        ).exclude(status__in=['crawling', 'processing'])

        if not sources.exists():
            return Response({'detail': 'No eligible sources to crawl.', 'started': 0})

        started = []
        for source in sources:
            t = threading.Thread(
                target=_run_crawl,
                args=(source.id,),
                daemon=True,
                name=f'manual-crawl-{source.id}',
            )
            t.start()
            started.append({'id': source.id, 'name': source.name})

        # Mark last_scraped_at in SystemSettings
        try:
            from settings_app.models import SystemSettings
            obj = SystemSettings.get_settings()
            obj.update_section('scraping', {
                'last_scraped_at': timezone.now().isoformat(),
            })
        except Exception:
            pass

        return Response({
            'detail':  f'Started crawling {len(started)} source(s).',
            'started': started,
        })


class CrawlStatusView(APIView):
    """
    GET /api/crawler/status/

    Returns:
      {
        "total": 5,
        "indexed": 3,
        "failed": 1,
        "pending": 1,
        "active": 4,
        "last_crawled": "2026-03-16T10:00:00Z",   # most recent across all sources
        "auto_scrape_enabled": true,
        "next_scrape_at": "2026-03-17T10:00:00Z"
      }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sources = CrawlSource.objects.all()

        counts = {'total': sources.count()}
        for s in ['indexed', 'failed', 'pending', 'crawling', 'processing']:
            counts[s] = sources.filter(status=s).count()
        counts['active'] = sources.filter(active=True).count()

        # Most recently crawled timestamp
        last = sources.filter(
            last_crawled__isnull=False
        ).order_by('-last_crawled').values_list('last_crawled', flat=True).first()

        counts['last_crawled'] = last.isoformat() if last else None

        # Auto-scrape info from SystemSettings
        try:
            from settings_app.models import SystemSettings
            obj      = SystemSettings.get_settings()
            scraping = obj.get_section('scraping')
            counts['auto_scrape_enabled']   = scraping.get('auto_scrape_enabled', False)
            counts['scrape_interval_hours'] = scraping.get('scrape_interval_hours', 24)
            counts['next_scrape_at']        = scraping.get('next_scrape_at')
            counts['last_scraped_at']       = scraping.get('last_scraped_at')
        except Exception:
            counts['auto_scrape_enabled'] = False
            counts['next_scrape_at']      = None
            counts['last_scraped_at']     = None

        return Response(counts)