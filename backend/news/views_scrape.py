"""
news/views_scrape.py

Sources:
  PRIMARY   /latest-events     → full event articles (title + body + image + date)
  SECONDARY /news-and-events   → full news articles
  SECONDARY /press-releases    → announcements with "Read more" links
  DISCOVERY /index.php         → homepage "Recent Events" module — discovers
                                  article links; full content fetched individually

DOM observed on zetech.ac.ke (Joomla CMS, 2026-03-16):
  /latest-events and /news-and-events:
    Content in <div class="item-page"> or <div class="blog">
    Pattern: <h3>Title</h3> <img ...> <p>body</p> <p>body</p> <h3>Next...</h3>
    Images: /images/events/filename.jpg  (relative URLs)
    Dates: embedded in body prose e.g. "On 27th February 2026..."
    No per-article wrapper div — articles are flat siblings

  /index.php recent events module:
    <h4><a href="/index.php/latest-events#anchor">Title</a></h4>
    Used as discovery only — we follow hrefs to get full content.
"""

import re
import json
import requests as http_requests
from datetime import datetime
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from decouple import config
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


BASE_URL = 'https://www.zetech.ac.ke'

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    ),
    'Accept':          'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

SOURCES = [
    {'url': 'https://www.zetech.ac.ke/index.php/latest-events',  'category': 'event',        'label': 'Latest Events'},
    {'url': 'https://www.zetech.ac.ke/index.php/news-and-events', 'category': 'news',         'label': 'News & Events'},
    {'url': 'https://www.zetech.ac.ke/index.php/press-releases',  'category': 'announcement', 'label': 'Press Releases'},
]

HOMEPAGE_URL = 'https://www.zetech.ac.ke/index.php'
MIN_BODY_LEN = 150

_MONTHS = (
    'january|february|march|april|may|june|july|august|september|'
    'october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec'
)
_DATE_RE = re.compile(
    rf'(\d{{1,2}}(?:st|nd|rd|th)?\s+(?:{_MONTHS})\s+\d{{4}})',
    re.IGNORECASE,
)

_TAG_MAP = {
    'innovation':   ['innovation', 'hackathon', 'tech', 'ai ', 'artificial intelligence', 'software', 'digital'],
    'partnerships': ['mou', 'partnership', 'collaboration', 'memorandum', 'signed', 'agreement'],
    'sports':       ['sport', 'athletics', 'football', 'basketball', 'volleyball', 'rugby', 'cycling', 'championship'],
    'health':       ['nursing', 'health', 'medical', 'clinical', 'healthcare'],
    'awards':       ['award', 'charter', 'accreditation', 'recognition', 'milestone', 'ranked'],
    'student life': ['student', 'club', 'campus life', 'welfare', 'society', 'mentorship'],
    'research':     ['research', 'publication', 'innovation hub'],
    'admissions':   ['intake', 'admission', 'application', 'enroll', 'apply', 'kuccps'],
    'community':    ['community', 'csr', 'social responsibility', 'charity', 'outreach'],
}


def _fetch(url):
    resp = http_requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, 'html.parser')


def _content_area(soup):
    return (
        soup.find('div', class_='item-page') or
        soup.find('div', class_='blog')       or
        soup.find('main')                      or
        soup.body
    )


def _extract_date(text):
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


def _extract_thumbnail(tag):
    img = tag.find('img') if hasattr(tag, 'find') else None
    if not img:
        return ''
    src = img.get('src', '')
    if not src:
        return ''
    skip = ['logo', 'icon', 'prog-cats', 'mod_', 'cache/mod', 'sliders', 'up.png']
    if any(s in src.lower() for s in skip):
        return ''
    return urljoin(BASE_URL, src)


def _infer_tags(text):
    tl = text.lower()
    return [tag for tag, kws in _TAG_MAP.items() if any(k in tl for k in kws)]


def _collect_body(h3_element):
    """Walk siblings from h3, collect paragraph text + first thumbnail. Stop at next h3."""
    parts, thumbnail = [], ''
    sib = h3_element.next_sibling
    while sib:
        if hasattr(sib, 'name') and sib.name:
            if sib.name == 'h3':
                break
            if sib.name in ('p', 'div'):
                text = sib.get_text(separator=' ', strip=True)
                if text and not re.match(r'^read\s+more', text, re.I) and len(text) > 10:
                    parts.append(text)
                if not thumbnail:
                    thumbnail = _extract_thumbnail(sib)
            if sib.name == 'img' and not thumbnail:
                thumbnail = _extract_thumbnail(sib)
        sib = sib.next_sibling
    return ' '.join(parts).strip(), thumbnail


def _scrape_full_page(source):
    """
    Scrape a page where full article content is inline.
    Pattern observed: <h3>Title</h3> [<img>] <p>body</p>... <h3>Next Title</h3>
    """
    soup = _fetch(source['url'])
    area = _content_area(soup)
    if not area:
        return []

    articles = []
    for h3 in area.find_all('h3'):
        title = h3.get_text(strip=True)

        # Skip sidebar/nav headings (short labels, no content follows)
        if not title or len(title) < 12:
            continue

        # Detect external links in the heading itself
        anchor = h3.find('a')
        external_link = ''
        if anchor:
            href = anchor.get('href', '')
            if href.startswith('http') and 'zetech.ac.ke' not in href:
                external_link = href

        body, thumbnail = _collect_body(h3)

        # Look backward for an image placed before the <h3> (events page pattern)
        if not thumbnail:
            prev = h3.previous_sibling
            while prev:
                if hasattr(prev, 'name') and prev.name:
                    if prev.name == 'h3':
                        break
                    t = _extract_thumbnail(prev)
                    if t:
                        thumbnail = t
                        break
                prev = prev.previous_sibling

        # No body = sidebar/nav element, skip
        if not body:
            continue

        # For press releases find "Read more" link
        if source['category'] == 'announcement' and not external_link:
            for sib in h3.next_siblings:
                if hasattr(sib, 'name') and sib.name == 'h3':
                    break
                if hasattr(sib, 'find'):
                    a = sib.find('a', string=re.compile(r'read\s+more', re.I))
                    if a and a.get('href'):
                        external_link = urljoin(BASE_URL, a['href'])
                        break

        event_date = _extract_date(body) if source['category'] == 'event' else ''

        articles.append({
            'title':         title,
            'content':       body,
            'category':      source['category'],
            'author':        '',
            'event_date':    event_date,
            'tags':          _infer_tags(title + ' ' + body),
            'external_link': external_link,
            'thumbnail_url': thumbnail,
            'source_url':    source['url'],
        })

    return articles


def _scrape_homepage_links():
    """
    Discover recently-featured article links from the homepage.
    Returns list of absolute URLs to individual article pages.
    """
    try:
        soup  = _fetch(HOMEPAGE_URL)
        links = []
        seen  = set()

        for a in soup.find_all('a', href=True):
            href = a.get('href', '')
            if not href:
                continue
            full   = urljoin(BASE_URL, href)
            parsed = urlparse(full)

            if 'zetech.ac.ke' not in parsed.netloc:
                continue

            # Only target content pages — not index listing pages
            path = parsed.path.rstrip('/')
            if not any(seg in path for seg in ['/latest-events', '/news-and-events', '/press-releases', '/blogs']):
                continue

            # Skip the top-level listing pages themselves (already scraped)
            if path in [
                '/index.php/latest-events',
                '/index.php/news-and-events',
                '/index.php/press-releases',
                '/index.php/blogs',
            ]:
                continue

            if full not in seen:
                seen.add(full)
                links.append(full)

        return links[:20]

    except Exception as e:
        print(f'[NewsScrape] Homepage discovery failed: {e}')
        return []


def _fetch_article_page(url):
    """
    Fetch a single article page and extract title + full body.
    Used for articles discovered via homepage links.
    """
    try:
        soup  = _fetch(url)
        area  = _content_area(soup)
        if not area:
            return None

        title_tag = area.find('h1') or area.find('h2')
        if not title_tag:
            return None
        title = title_tag.get_text(strip=True)
        if not title or len(title) < 10:
            return None

        paragraphs = [
            p.get_text(separator=' ', strip=True)
            for p in area.find_all('p')
            if len(p.get_text(strip=True)) > 20
        ]
        body = ' '.join(paragraphs).strip()
        if not body:
            return None

        thumbnail = ''
        for img in area.find_all('img'):
            t = _extract_thumbnail(img)
            if t:
                thumbnail = t
                break

        path     = urlparse(url).path
        category = 'event' if 'event' in path else ('announcement' if 'press' in path or 'release' in path else 'news')

        return {
            'title':         title,
            'content':       body,
            'category':      category,
            'author':        '',
            'event_date':    _extract_date(body) if category == 'event' else '',
            'tags':          _infer_tags(title + ' ' + body),
            'external_link': url,
            'thumbnail_url': thumbnail,
            'source_url':    url,
        }

    except Exception as e:
        print(f'[NewsScrape] Article fetch failed for {url}: {e}')
        return None


def _enrich_short_articles(articles, api_key):
    """
    LLM-expand articles whose body is under MIN_BODY_LEN chars.
    This is the ONLY place the LLM is used in the scraper.
    """
    for article in articles:
        if len(article.get('content', '')) >= MIN_BODY_LEN:
            continue
        try:
            prompt = (
                f"Write 2-3 informative sentences about this Zetech University news item "
                f"based on the title and any snippet. Return only the sentences.\n\n"
                f"TITLE: {article['title']}\n"
                f"SNIPPET: {article.get('content') or '(none)'}"
            )
            resp = http_requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                json={
                    'model':       'arcee-ai/trinity-mini:free',
                    'messages':    [{'role': 'user', 'content': prompt}],
                    'max_tokens':  200,
                    'temperature': 0.4,
                },
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type':  'application/json',
                },
                timeout=20,
            )
            resp.raise_for_status()
            enriched = resp.json()['choices'][0]['message']['content'].strip()
            if enriched and len(enriched) > len(article.get('content', '')):
                article['content'] = enriched
        except Exception as e:
            print(f'[NewsScrape] Enrichment failed for "{article["title"]}": {e}')

    return articles


# ── View ──────────────────────────────────────────────────────────────────────

class ScrapeNewsView(APIView):
    """
    POST /api/news/posts/scrape/

    action=scrape   → scrape all sources, return candidates for admin review
    action=confirm  → save admin-selected articles to DB

    Flow:
      1. Scrape /latest-events, /news-and-events, /press-releases (full body)
      2. Discover links from homepage → fetch each article page individually
      3. Deduplicate by title
      4. LLM-enrich articles with body < 150 chars (optional)
      5. Flag already-existing titles against DB
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        action = request.data.get('action', 'scrape')
        if action == 'scrape':
            return self._scrape(request)
        if action == 'confirm':
            return self._confirm(request)
        return Response({'error': 'Unknown action'}, status=400)

    def _scrape(self, request):
        api_key      = config('OPENROUTER_API_KEY', default='')
        all_articles = []
        errors       = []

        # Step 1 — full-body pages
        for source in SOURCES:
            try:
                found = _scrape_full_page(source)
                print(f'[NewsScrape] {source["label"]}: {len(found)} articles')
                all_articles.extend(found)
            except http_requests.RequestException as e:
                errors.append(f'{source["label"]}: fetch failed — {e}')
            except Exception as e:
                errors.append(f'{source["label"]}: parse error — {e}')

        # Step 2 — homepage discovery
        existing_titles = {a['title'].lower().strip() for a in all_articles}
        for url in _scrape_homepage_links():
            try:
                article = _fetch_article_page(url)
                if not article:
                    continue
                if article['title'].lower().strip() not in existing_titles:
                    all_articles.append(article)
                    existing_titles.add(article['title'].lower().strip())
            except Exception as e:
                errors.append(f'Homepage link {url}: {e}')

        # Step 3 — deduplicate
        seen, unique = set(), []
        for a in all_articles:
            key = a['title'].lower().strip()
            if key and key not in seen:
                seen.add(key)
                unique.append(a)

        # Step 4 — LLM enrich thin articles
        if api_key:
            unique = _enrich_short_articles(unique, api_key)

        # Step 5 — flag DB duplicates
        from .models import NewsPost
        db_titles = {t.lower().strip() for t in NewsPost.objects.values_list('title', flat=True)}
        for a in unique:
            a['already_exists'] = a['title'].lower().strip() in db_titles

        return Response({
            'articles':  unique,
            'total':     len(unique),
            'new_count': sum(1 for a in unique if not a['already_exists']),
            'errors':    errors,
        })

    def _confirm(self, request):
        articles = request.data.get('articles', [])
        if not articles:
            return Response({'error': 'No articles provided'}, status=400)

        from .models import NewsPost
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
                    category      = a.get('category', 'news'),
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
                errors.append(f"{a.get('title', '?')}: {str(e)}")
                skipped += 1

        return Response({'saved': saved, 'skipped': skipped, 'errors': errors})