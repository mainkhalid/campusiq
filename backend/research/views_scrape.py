"""
research/views_scrape.py

Scrapes https://research.zetech.ac.ke for:

  1. Research news articles  → saved to news.NewsPost (category='news', tags=['research'])
     Source: homepage news module → follow each article link for full body

  2. Research projects        → saved to research.ResearchProject
     Source: /index.php/research-projects → numbered list with PI names

DOM observed on research.zetech.ac.ke (Joomla, same CMS as main site):
  Homepage news module:
    <h4><a href="/index.php/news/slug">Title</a></h4>
    <img src="/cache/...">
    <p>excerpt...</p>
    <a>Read more</a>

  Individual article page:
    <div class="item-page">
      <h2>Full Title</h2>
      <img src="/images/articles/...">
      <p>Body paragraph 1</p>
      <p>Body paragraph 2</p>
      ...
    </div>

  Research projects page:
    <p><strong>Completed Research</strong></p>
    <ol>
      <li>Title. PI: Name</li>
      ...
    </ol>
"""

import re
import requests as http_requests
from datetime import datetime
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from decouple import config
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


BASE_URL    = 'https://research.zetech.ac.ke'
HOMEPAGE    = 'https://research.zetech.ac.ke/index.php'
PROJECTS_URL = 'https://research.zetech.ac.ke/index.php/research-projects'

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    ),
    'Accept':          'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

# Tags inferred from article text
_TAG_MAP = {
    'innovation':      ['innovation', 'innovate', 'hackathon', 'startup', 'entrepreneurship'],
    'partnerships':    ['partnership', 'mou', 'collaboration', 'agreement', 'partner'],
    'grants':          ['grant', 'funding', 'award', 'fund', 'scholarship'],
    'conferences':     ['conference', 'workshop', 'seminar', 'training', 'symposium'],
    'technology':      ['ai', 'machine learning', 'software', 'ict', 'digital', 'data'],
    'health research': ['health', 'medical', 'nursing', 'disease', 'clinical'],
    'research':        ['research', 'publication', 'journal', 'study', 'findings'],
}

_DATE_RE = re.compile(
    r'(\d{1,2}(?:st|nd|rd|th)?\s+'
    r'(?:january|february|march|april|may|june|july|august|september|'
    r'october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)'
    r'\s+\d{4})',
    re.IGNORECASE,
)


def _fetch(url: str) -> BeautifulSoup:
    resp = http_requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, 'html.parser')


def _content_area(soup: BeautifulSoup):
    return (
        soup.find('div', class_='item-page') or
        soup.find('div', class_='blog')       or
        soup.find('main')                      or
        soup.body
    )


def _extract_thumbnail(area, base: str = BASE_URL) -> str:
    """Find first article-quality image in the content area."""
    for img in area.find_all('img'):
        src = img.get('src', '')
        if not src:
            continue
        skip = ['logo', 'icon', 'mod_', 'cache/mod', 'sliders', 'up.png', 'active.png']
        if any(s in src.lower() for s in skip):
            continue
        return urljoin(base, src)
    return ''


def _infer_tags(text: str) -> list:
    tl = text.lower()
    return [tag for tag, kws in _TAG_MAP.items() if any(k in tl for k in kws)]


def _extract_date(text: str) -> str:
    match = _DATE_RE.search(text)
    if not match:
        return ''
    raw = re.sub(r'(\d+)(?:st|nd|rd|th)', r'\1', match.group(1))
    for fmt in ('%d %B %Y', '%d %b %Y'):
        try:
            return datetime.strptime(raw.strip(), fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return ''


# ── 1. Discover article links from homepage ───────────────────────────────────

def _discover_article_links() -> list:
    """
    Pull all news article links from the research homepage.
    Pattern: <h4><a href="/index.php/news/...">Title</a></h4>
    Returns list of absolute URLs.
    """
    try:
        soup  = _fetch(HOMEPAGE)
        links = []
        seen  = set()

        for a in soup.find_all('a', href=True):
            href = a.get('href', '')
            full = urljoin(BASE_URL, href)
            parsed = urlparse(full)

            if 'research.zetech.ac.ke' not in parsed.netloc:
                continue
            # Only follow /news/ article paths
            if '/index.php/news/' not in parsed.path:
                continue
            # Skip generic news index
            if parsed.path.rstrip('/') in ['/index.php/news']:
                continue

            if full not in seen:
                seen.add(full)
                links.append(full)

        return links

    except Exception as e:
        print(f'[ResearchScrape] Homepage discovery failed: {e}')
        return []


# ── 2. Fetch individual article page ─────────────────────────────────────────

def _fetch_article(url: str) -> dict | None:
    """
    Fetch one research news article page.
    Returns article dict compatible with news.NewsPost or None.
    """
    try:
        soup  = _fetch(url)
        area  = _content_area(soup)
        if not area:
            return None

        # Title: h2 inside content area (individual article pages use h2)
        title_tag = area.find('h2') or area.find('h1')
        if not title_tag:
            return None
        title = re.sub(r'\s+', ' ', title_tag.get_text(strip=True))
        if not title or len(title) < 10:
            return None

        # Body: all meaningful <p> tags
        paragraphs = [
            re.sub(r'\s+', ' ', p.get_text(separator=' ', strip=True))
            for p in area.find_all('p')
            if len(p.get_text(strip=True)) > 20
        ]
        body = ' '.join(paragraphs).strip()
        if not body:
            return None

        thumbnail  = _extract_thumbnail(area)
        event_date = _extract_date(body)
        tags       = list(set(_infer_tags(title + ' ' + body) + ['research']))

        return {
            'title':         title,
            'content':       body,
            'category':      'news',
            'author':        '',
            'event_date':    event_date,
            'tags':          tags,
            'external_link': url,
            'thumbnail_url': thumbnail,
            'source_url':    url,
        }

    except Exception as e:
        print(f'[ResearchScrape] Article fetch failed {url}: {e}')
        return None


# ── 3. Scrape research projects list ─────────────────────────────────────────

def _scrape_projects() -> list:
    """
    Extract research project entries from /index.php/research-projects.

    The page has a numbered list under "Completed Research":
      1. Title. PI: Prof. Name
      2. Title. PI: Dr. Name, Co-investigator.

    Returns list of dicts compatible with research.ResearchProject.
    """
    try:
        soup = _fetch(PROJECTS_URL)
        area = _content_area(soup)
        if not area:
            return []

        projects = []

        # Find all <li> items in the content area
        for li in area.find_all('li'):
            text = re.sub(r'\s+', ' ', li.get_text(strip=True))
            if not text or len(text) < 15:
                continue

            # Extract PI name: "PI: Name" or "PI: Name, Co-PI: Name"
            lead = ''
            pi_match = re.search(r'PI:\s*([^,\n.]+)', text, re.IGNORECASE)
            if pi_match:
                lead = pi_match.group(1).strip()
                # Remove PI section from title
                title = text[:text.lower().find('pi:')].strip().rstrip('.')
            else:
                title = text

            title = title.strip().rstrip('.')
            if not title or len(title) < 10:
                continue

            # Infer department from title keywords
            title_lower = title.lower()
            if any(kw in title_lower for kw in ['health', 'medical', 'disease', 'covid', 'pandemic']):
                department = 'Health'
            elif any(kw in title_lower for kw in ['technology', 'ict', 'digital', 'software', 'ai', 'data']):
                department = 'Tech'
            elif any(kw in title_lower for kw in ['arts', 'culture', 'heritage', 'language', 'social']):
                department = 'Arts'
            else:
                department = 'Sciences'

            projects.append({
                'title':      title,
                'lead':       lead or 'Zetech University',
                'department': department,
                'funding':    '',
                'status':     'Completed',
                'abstract':   text,   # full list item as abstract
                'tags':       _infer_tags(title),
                'source_url': PROJECTS_URL,
            })

        return projects

    except Exception as e:
        print(f'[ResearchScrape] Projects scrape failed: {e}')
        return []


# ── View ──────────────────────────────────────────────────────────────────────

class ScrapeResearchView(APIView):
    """
    POST /api/research/scrape/

    action=scrape         → scrape homepage news + projects list, return for review
    action=confirm_news   → save selected articles to news.NewsPost
    action=confirm_projects → save selected projects to research.ResearchProject
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        action = request.data.get('action', 'scrape')
        if action == 'scrape':
            return self._scrape(request)
        if action == 'confirm_news':
            return self._confirm_news(request)
        if action == 'confirm_projects':
            return self._confirm_projects(request)
        return Response({'error': 'Unknown action'}, status=400)

    def _scrape(self, request):
        errors   = []
        articles = []
        projects = []

        # News articles — discover links then fetch each
        links = _discover_article_links()
        for url in links:
            try:
                article = _fetch_article(url)
                if article:
                    articles.append(article)
            except Exception as e:
                errors.append(f'Article {url}: {e}')

        # Deduplicate articles by title
        seen, unique_articles = set(), []
        for a in articles:
            key = a['title'].lower().strip()
            if key and key not in seen:
                seen.add(key)
                unique_articles.append(a)

        # Flag existing news articles
        from news.models import NewsPost
        existing_news = {t.lower().strip() for t in NewsPost.objects.values_list('title', flat=True)}
        for a in unique_articles:
            a['already_exists'] = a['title'].lower().strip() in existing_news

        # Research projects
        try:
            projects = _scrape_projects()
        except Exception as e:
            errors.append(f'Projects: {e}')

        # Flag existing projects
        from research.models import ResearchProject
        existing_projects = {t.upper().strip() for t in ResearchProject.objects.values_list('title', flat=True)}
        for p in projects:
            p['already_exists'] = p['title'].upper().strip() in existing_projects

        return Response({
            'articles':        unique_articles,
            'articles_total':  len(unique_articles),
            'articles_new':    sum(1 for a in unique_articles if not a['already_exists']),
            'projects':        projects,
            'projects_total':  len(projects),
            'projects_new':    sum(1 for p in projects if not p['already_exists']),
            'errors':          errors,
            'source_url':      BASE_URL,
        })

    def _confirm_news(self, request):
        articles = request.data.get('articles', [])
        if not articles:
            return Response({'error': 'No articles provided'}, status=400)

        from news.models import NewsPost
        saved, skipped, errors = 0, 0, []

        for a in articles:
            try:
                title = a.get('title', '').strip()
                if not title:
                    skipped += 1
                    continue
                if NewsPost.objects.filter(title__iexact=title).exists():
                    errors.append(f'Skipped (duplicate): {title}')
                    skipped += 1
                    continue

                tags = a.get('tags', [])
                if isinstance(tags, str):
                    tags = [t.strip() for t in tags.split(',') if t.strip()]

                event_date = None
                raw_date   = a.get('event_date', '')
                if raw_date:
                    try:
                        event_date = datetime.strptime(raw_date, '%Y-%m-%d').date()
                    except ValueError:
                        pass

                thumbnail_url = a.get('thumbnail_url', '')
                NewsPost.objects.create(
                    title         = title,
                    content       = a.get('content', ''),
                    category      = 'news',
                    author        = a.get('author', ''),
                    event_date    = event_date,
                    tags          = tags,
                    external_link = a.get('external_link', ''),
                    thumbnail     = {'url': thumbnail_url} if thumbnail_url else {},
                    status        = 'published',
                    created_by    = request.user,
                )
                saved += 1
            except Exception as e:
                errors.append(f"{a.get('title', '?')}: {e}")
                skipped += 1

        return Response({'saved': saved, 'skipped': skipped, 'errors': errors})

    def _confirm_projects(self, request):
        projects = request.data.get('projects', [])
        if not projects:
            return Response({'error': 'No projects provided'}, status=400)

        from research.models import ResearchProject
        saved, skipped, errors = 0, 0, []

        for p in projects:
            try:
                title = p.get('title', '').strip()
                if not title:
                    skipped += 1
                    continue
                if ResearchProject.objects.filter(title__iexact=title).exists():
                    errors.append(f'Skipped (duplicate): {title}')
                    skipped += 1
                    continue

                tags = p.get('tags', [])
                if isinstance(tags, str):
                    tags = [t.strip() for t in tags.split(',') if t.strip()]

                # publish=True when called from scrape tab confirm
                # (frontend passes publish:true); False otherwise
                should_publish = request.data.get('publish', False)

                ResearchProject.objects.create(
                    title       = title,
                    lead        = p.get('lead', 'Zetech University'),
                    department  = p.get('department', 'Sciences'),
                    funding     = p.get('funding', ''),
                    status      = p.get('status', 'Completed'),
                    abstract    = p.get('abstract', ''),
                    tags        = tags,
                    published   = bool(should_publish),
                    created_by  = request.user,
                )
                saved += 1
            except Exception as e:
                errors.append(f"{p.get('title', '?')}: {e}")
                skipped += 1

        return Response({'saved': saved, 'skipped': skipped, 'errors': errors})