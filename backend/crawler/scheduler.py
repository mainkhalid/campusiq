"""
crawler/scheduler.py

Lightweight daemon thread that wakes every 60 seconds and checks
whether an auto-crawl is due. No Celery, no Redis, no extra dependencies.

How it works
────────────
1. start() is called once from CrawlerConfig.ready()
2. The daemon thread loops forever, sleeping 60 s between ticks
3. On each tick it reads SystemSettings.scraping:
   - if auto_scrape_enabled is False  → skip
   - if disable_scraping is True      → skip
   - if next_scrape_at hasn't passed  → skip
   - otherwise                        → fire crawls, update timestamps

Which sources are crawled is controlled by three boolean flags:
   scrape_main_site, scrape_research_site, scrape_news_site

Each flag maps to CrawlSource names that contain a keyword in their URL
or name (see _sources_for_flags). Admin can add more sources; the
scheduler will pick them up automatically as long as they're active.

Thread safety
─────────────
All DB reads/writes go through Django ORM which handles its own
connection pooling. We close the connection explicitly at the end
of each tick so it isn't held open during the 60s sleep.
"""
import threading
import time
import logging
from datetime import datetime, timezone, timedelta

logger = logging.getLogger('crawler.scheduler')

_started = False          # module-level guard against double-start
_lock    = threading.Lock()


def start():
    global _started
    with _lock:
        if _started:
            return
        _started = True

    t = threading.Thread(
        target=_loop,
        name='auto-crawl-scheduler',
        daemon=True,        
    )
    t.start()
    logger.info('[Scheduler] Auto-crawl scheduler started')


def _loop():
    time.sleep(10)

    while True:
        try:
            _tick()
        except Exception as e:
            logger.exception(f'[Scheduler] Unhandled error in tick: {e}')
        finally:
            # Always release the DB connection before sleeping
            try:
                from django.db import connection
                connection.close()
            except Exception:
                pass

        time.sleep(60)   
def _tick():
    """
    Single scheduler tick. Reads settings, decides whether to crawl, fires threads.
    """
    from settings_app.models import SystemSettings

    obj        = SystemSettings.get_settings()
    scraping   = obj.get_section('scraping')
    maintenance = obj.get_section('maintenance')

    # Hard stops
    if not scraping.get('auto_scrape_enabled', False):
        return
    if maintenance.get('disable_scraping', False):
        logger.debug('[Scheduler] Scraping paused by maintenance settings')
        return

    # Check schedule
    next_run_str = scraping.get('next_scrape_at')
    now          = datetime.now(timezone.utc)

    if next_run_str:
        try:
            next_run = datetime.fromisoformat(next_run_str)
            # Make timezone-aware if naive
            if next_run.tzinfo is None:
                next_run = next_run.replace(tzinfo=timezone.utc)
            if now < next_run:
                return   # not due yet
        except ValueError:
            pass   # malformed timestamp — treat as due

    logger.info('[Scheduler] Auto-crawl due — starting')

    # Determine which sources to crawl based on flags
    flags = {
        'main':     scraping.get('scrape_main_site',      True),
        'research': scraping.get('scrape_research_site',  True),
        'news':     scraping.get('scrape_news_site',      True),
    }

    source_ids = _select_sources(flags)

    if not source_ids:
        logger.info('[Scheduler] No eligible sources found — nothing to crawl')
    else:
        _fire_crawls(source_ids)

    # Also run structured scrapers (research site + main news)
    if flags['research']:
        _run_research_scraper()
    if flags['news']:
        _run_news_scraper()

    # Update timestamps
    interval_hours = scraping.get('scrape_interval_hours', 24)
    next_run_new   = now + timedelta(hours=interval_hours)

    obj.update_section('scraping', {
        'last_scraped_at': now.isoformat(),
        'next_scrape_at':  next_run_new.isoformat(),
    })

    logger.info(
        f'[Scheduler] Crawled {len(source_ids)} source(s). '
        f'Next run at {next_run_new.strftime("%Y-%m-%d %H:%M UTC")}'
    )


# ── Source selection ──────────────────────────────────────────────────────────

def _select_sources(flags: dict) -> list:
    """
    Return IDs of active, non-busy website sources that match the enabled flags.

    Matching logic:
    - 'main'     → sources whose URL contains zetech.ac.ke 
    - 'research' → sources whose URL contains research.zetech.ac.ke
    - 'news'     → sources whose name contains 'news' (case-insensitive)
                   OR URL contains /news or /events

    Sources that don't match any of these patterns are included regardless
    (catch-all for custom sources the admin added manually).
    """
    from .models import CrawlSource

    qs = CrawlSource.objects.filter(
        active=True,
        source_type='website',
    ).exclude(
        status__in=['crawling', 'processing']
    )

    if not qs.exists():
        return []

    selected = []
    for source in qs:
        url  = (source.url  or '').lower()
        name = (source.name or '').lower()

        is_research = 'research.zetech' in url
        is_news     = 'news' in name or '/news' in url or '/events' in url
        is_main     = 'zetech.ac.ke' in url and not is_research

        if is_research and flags.get('research'):
            selected.append(source.id)
        elif is_news and flags.get('news'):
            selected.append(source.id)
        elif is_main and flags.get('main'):
            selected.append(source.id)
        elif not is_research and not is_news and not is_main:
            # Custom source — always include when any flag is on
            if any(flags.values()):
                selected.append(source.id)

    return selected

def _fire_crawls(source_ids: list):
    from .views import _run_crawl
    for sid in source_ids:
        t = threading.Thread(
            target=_run_crawl,
            args=(sid,),
            daemon=True,
            name=f'auto-crawl-{sid}',
        )
        t.start()
        logger.debug(f'[Scheduler] Fired crawl thread for source {sid}')


# ── Structured scrapers ───────────────────────────────────────────────────────

def _run_research_scraper():
    """
    Calls the research site scraper (research.zetech.ac.ke) and auto-confirms
    all new articles + projects. Runs in a background thread.
    """
    def _go():
        try:
            import requests as http
            from django.conf import settings as djsettings

            base = getattr(djsettings, 'INTERNAL_API_BASE', 'http://127.0.0.1:8000')
            token = getattr(djsettings, 'SCHEDULER_API_TOKEN', None)
            if not token:
                logger.debug('[Scheduler] No SCHEDULER_API_TOKEN — skipping research scraper')
                return

            headers = {'Authorization': f'Token {token}', 'Content-Type': 'application/json'}

            # 1. Scrape
            scrape_res = http.post(
                f'{base}/api/research/scrape/',
                json={'action': 'scrape'},
                headers=headers,
                timeout=60,
            )
            if scrape_res.status_code != 200:
                logger.warning(f'[Scheduler] Research scrape returned {scrape_res.status_code}')
                return

            data = scrape_res.json()

            # 2. Auto-confirm new articles
            new_articles = [a for a in data.get('articles', []) if not a.get('already_exists')]
            if new_articles:
                http.post(
                    f'{base}/api/research/scrape/',
                    json={'action': 'confirm_news', 'articles': new_articles},
                    headers=headers,
                    timeout=30,
                )
                logger.info(f'[Scheduler] Auto-saved {len(new_articles)} research news articles')

            # 3. Auto-confirm new projects (published=True)
            new_projects = [p for p in data.get('projects', []) if not p.get('already_exists')]
            if new_projects:
                http.post(
                    f'{base}/api/research/scrape/',
                    json={'action': 'confirm_projects', 'projects': new_projects, 'publish': True},
                    headers=headers,
                    timeout=30,
                )
                logger.info(f'[Scheduler] Auto-saved {len(new_projects)} research projects')

        except Exception as e:
            logger.exception(f'[Scheduler] Research scraper failed: {e}')

    threading.Thread(target=_go, daemon=True, name='auto-research-scraper').start()


def _run_news_scraper():
    """
    Calls the main news scraper (zetech.ac.ke/news) and auto-confirms new articles.
    """
    def _go():
        try:
            import requests as http
            from django.conf import settings as djsettings

            base  = getattr(djsettings, 'INTERNAL_API_BASE', 'http://127.0.0.1:8000')
            token = getattr(djsettings, 'SCHEDULER_API_TOKEN', None)
            if not token:
                logger.debug('[Scheduler] No SCHEDULER_API_TOKEN — skipping news scraper')
                return

            headers = {'Authorization': f'Token {token}', 'Content-Type': 'application/json'}

            scrape_res = http.post(
                f'{base}/api/news/scrape/',
                json={'action': 'scrape'},
                headers=headers,
                timeout=60,
            )
            if scrape_res.status_code != 200:
                logger.warning(f'[Scheduler] News scrape returned {scrape_res.status_code}')
                return

            data = scrape_res.json()
            new_articles = [a for a in data.get('articles', []) if not a.get('already_exists')]
            if new_articles:
                http.post(
                    f'{base}/api/news/scrape/',
                    json={'action': 'confirm', 'articles': new_articles},
                    headers=headers,
                    timeout=30,
                )
                logger.info(f'[Scheduler] Auto-saved {len(new_articles)} news articles')

        except Exception as e:
            logger.exception(f'[Scheduler] News scraper failed: {e}')

    threading.Thread(target=_go, daemon=True, name='auto-news-scraper').start()