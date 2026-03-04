"""
crawler/crawler_service.py

Handles:
  1. Website crawling  — requests + BeautifulSoup
  2. PDF extraction    — pdfplumber
  3. Chunking          — split text into ~500 token chunks with overlap
  4. Embedding         — OpenRouter / any compatible endpoint
  5. Similarity search — cosine similarity in pure Python (no vector DB needed)

Dependencies (add to requirements.txt):
  pdfplumber
  beautifulsoup4
  requests   (already present)
"""
import re
import math
import time
from urllib.parse import urljoin, urlparse
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from decouple import config


# ── Constants ─────────────────────────────────────────────
CHUNK_SIZE    = 800    # increased from 500 — fee tables need larger chunks
                       # to avoid cutting numbers mid-figure
CHUNK_OVERLAP = 150    # increased overlap so no row is lost between chunks
MAX_PAGES     = 30     # max pages to crawl per source
TOP_K         = 15      # chunks to return per query

# Embedding backend — swap by changing EMBED_BACKEND:
#   'local'      — free, runs on CPU via sentence-transformers (development)
#   'openrouter' — paid API via OpenRouter (production)
EMBED_BACKEND = 'local'
EMBED_MODEL   = 'all-MiniLM-L6-v2'              # local model (free)
# EMBED_MODEL = 'qwen/qwen3-embedding-0.6b'     # OpenRouter model (~/bin/sh.01/1M tokens)

# Lazy-loaded local model — only instantiated on first call
_local_model = None


# ── Embedding ─────────────────────────────────────────────

def get_embedding(text: str) -> list[float]:
    """
    Get embedding vector for a piece of text.

    EMBED_BACKEND = 'local':
        Uses sentence-transformers running on CPU.
        Free, no API key needed.
        Model downloads once (~90MB) on first call.
        Switch to 'openrouter' for production.

    EMBED_BACKEND = 'openrouter':
        Calls OpenRouter embedding API.
        Requires OPENROUTER_API_KEY in .env
        Cost: ~/bin/sh.01 per million tokens (qwen model)
    """
    if not text.strip():
        return []

    if EMBED_BACKEND == 'local':
        return _get_local_embedding(text)
    else:
        return _get_openrouter_embedding(text)


def _get_local_embedding(text: str) -> list[float]:
    """sentence-transformers running locally — free, no API key needed."""
    global _local_model
    try:
        if _local_model is None:
            from sentence_transformers import SentenceTransformer
            print(f'Loading embedding model {EMBED_MODEL} (first call only)...')
            _local_model = SentenceTransformer(EMBED_MODEL)
            print('Embedding model loaded.')
        return _local_model.encode(text[:2000]).tolist()
    except ImportError:
        print('sentence-transformers not installed. Run: pip install sentence-transformers')
        return []
    except Exception as e:
        print(f'Local embedding error: {e}')
        return []


def _get_openrouter_embedding(text: str) -> list[float]:
    """OpenRouter API embedding — for production use."""
    api_key = config('OPENROUTER_API_KEY', default='')
    if not api_key:
        print('OPENROUTER_API_KEY not set')
        return []
    try:
        response = requests.post(
            'https://openrouter.ai/api/v1/embeddings',
            json={'model': EMBED_MODEL, 'input': text[:2000]},
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type':  'application/json',
            },
            timeout=15
        )
        response.raise_for_status()
        return response.json()['data'][0]['embedding']
    except Exception as e:
        print(f'OpenRouter embedding error: {e}')
        return []


# ── Cosine similarity ─────────────────────────────────────

def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot     = sum(x * y for x, y in zip(a, b))
    norm_a  = math.sqrt(sum(x * x for x in a))
    norm_b  = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ── Text chunking ─────────────────────────────────────────

def chunk_text(text: str, source_meta: dict = None) -> list[dict]:
    """
    Split text into overlapping chunks of ~CHUNK_SIZE characters.

    Strategy:
    - Try sentence-boundary splitting first (good for prose)
    - Fall back to word-boundary splitting for tables/lists that have
      few sentence endings (fee tables, programme lists etc.)
    - CHUNK_OVERLAP ensures no data row is lost between adjacent chunks
    """
    text = re.sub(r'\s+', ' ', text).strip()
    if not text:
        return []

    def _make_chunk(content, index):
        return {'content': content.strip(), 'chunk_index': index, **(source_meta or {})}

    sentences = re.split(r'(?<=[.!?])\s+', text)

    # Fee tables / dense data pages produce very few sentences.
    # If fewer than 3 sentence breaks found, use word-boundary splitting
    # so we never slice through the middle of a number like '54,'.
    if len(sentences) <= 3:
        words = text.split()
        chunks, current_words, index = [], [], 0
        for word in words:
            current_words.append(word)
            if len(' '.join(current_words)) >= CHUNK_SIZE:
                chunks.append(_make_chunk(' '.join(current_words), index))
                index += 1
                # Overlap: keep last N words so adjacent chunks share context
                overlap_words  = max(1, CHUNK_OVERLAP // 5)
                current_words  = current_words[-overlap_words:]
        if current_words:
            chunks.append(_make_chunk(' '.join(current_words), index))
        return chunks

    # Standard sentence-boundary chunking for prose content
    chunks, current, index = [], '', 0
    for sentence in sentences:
        if len(current) + len(sentence) <= CHUNK_SIZE:
            current += (' ' if current else '') + sentence
        else:
            if current:
                chunks.append(_make_chunk(current, index))
                index += 1
                words        = current.split()
                overlap_words = max(1, CHUNK_OVERLAP // 5)
                current      = ' '.join(words[-overlap_words:]) + ' ' + sentence
            else:
                current = sentence  # sentence alone exceeds chunk size

    if current.strip():
        chunks.append(_make_chunk(current, index))

    return chunks


# ── HTML cleaning ─────────────────────────────────────────

def extract_text_from_html(html: str, url: str = '') -> tuple[str, str]:
    """
    Extract clean text and page title from raw HTML.
    Removes nav, footer, scripts, ads — keeps content.
    Returns (title, clean_text)
    """
    soup = BeautifulSoup(html, 'html.parser')

    # Remove noise
    for tag in soup(['script', 'style', 'nav', 'footer', 'header',
                     'aside', 'noscript', 'form', 'button', 'iframe']):
        tag.decompose()

    title = ''
    if soup.title:
        title = soup.title.get_text(strip=True)
    elif soup.find('h1'):
        title = soup.find('h1').get_text(strip=True)

    # Prefer main content containers
    content_tags = soup.find_all(['main', 'article', 'section', '.content', '#content'])
    if content_tags:
        text = ' '.join(tag.get_text(separator=' ', strip=True) for tag in content_tags)
    else:
        text = soup.get_text(separator=' ', strip=True)

    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return title, text


# ── Web crawler ───────────────────────────────────────────

def crawl_website(source) -> tuple[int, str]:
    """
    Crawl a website URL up to `source.crawl_depth` levels deep.
    Saves CrawlChunk objects to the DB.
    Returns (chunk_count, error_message)
    """
    from .models import CrawlChunk

    base_url    = source.url.rstrip('/')
    base_domain = urlparse(base_url).netloc
    visited     = set()
    to_visit    = [(base_url, 0)]   # (url, depth)
    all_chunks  = []

    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (compatible; ZetechBot/1.0)'
    })

    while to_visit and len(visited) < MAX_PAGES:
        url, depth = to_visit.pop(0)
        if url in visited:
            continue
        visited.add(url)

        try:
            resp = session.get(url, timeout=10, allow_redirects=True)
            if resp.status_code != 200:
                continue
            if 'text/html' not in resp.headers.get('Content-Type', ''):
                continue

            title, text = extract_text_from_html(resp.text, url)
            if not text or len(text) < 100:
                continue

            # Chunk this page
            page_chunks = chunk_text(text, source_meta={
                'page_url':   url,
                'page_title': title,
            })
            all_chunks.extend(page_chunks)

            # Follow links if not at max depth
            if depth < source.crawl_depth:
                soup  = BeautifulSoup(resp.text, 'html.parser')
                links = soup.find_all('a', href=True)
                for link in links:
                    href     = link['href'].strip()
                    full_url = urljoin(url, href).split('#')[0].rstrip('/')
                    parsed   = urlparse(full_url)
                    # Stay on same domain, only HTML pages
                    if (parsed.netloc == base_domain
                            and full_url not in visited
                            and not any(full_url.endswith(ext)
                                        for ext in ['.pdf', '.jpg', '.png', '.zip', '.docx'])):
                        to_visit.append((full_url, depth + 1))

            time.sleep(0.5)   # be polite to the server

        except Exception as e:
            print(f'Crawl error on {url}: {e}')
            continue

    if not all_chunks:
        return 0, 'No content could be extracted from the URL'

    # Delete old chunks for this source before re-indexing
    CrawlChunk.objects.filter(source=source).delete()

    # Embed and save each chunk
    saved = 0
    for chunk in all_chunks:
        embedding = get_embedding(chunk['content'])
        CrawlChunk.objects.create(
            source     = source,
            content    = chunk['content'],
            page_url   = chunk.get('page_url', ''),
            page_title = chunk.get('page_title', ''),
            embedding  = embedding,
            metadata   = {'chunk_index': chunk.get('chunk_index', saved)},
        )
        saved += 1
        time.sleep(0.1)  # rate limit embeddings

    return saved, ''


# ── PDF extractor ─────────────────────────────────────────

def extract_pdf(source) -> tuple[int, str]:
    """
    Extract text from an uploaded PDF, chunk it, embed each chunk, save to DB.
    Deletes the physical PDF file after extraction (chunks are all we need).
    Returns (chunk_count, error_message)
    """
    try:
        import pdfplumber
    except ImportError:
        return 0, 'pdfplumber is not installed. Run: pip install pdfplumber'

    from .models import CrawlChunk

    if not source.pdf_file:
        return 0, 'No PDF file found on this source'

    try:
        all_text_by_page = []

        with pdfplumber.open(source.pdf_file.path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text and text.strip():
                    all_text_by_page.append({
                        'page_num': page_num,
                        'text':     text.strip(),
                    })

        if not all_text_by_page:
            return 0, 'PDF appears to be empty or image-based (no extractable text)'

        # Delete old chunks for this source
        CrawlChunk.objects.filter(source=source).delete()

        saved = 0
        for page_data in all_text_by_page:
            chunks = chunk_text(page_data['text'], source_meta={
                'page_url':   '',
                'page_title': f"{source.name} — Page {page_data['page_num']}",
            })
            for chunk in chunks:
                embedding = get_embedding(chunk['content'])
                CrawlChunk.objects.create(
                    source     = source,
                    content    = chunk['content'],
                    page_url   = '',
                    page_title = chunk.get('page_title', ''),
                    embedding  = embedding,
                    metadata   = {
                        'chunk_index': chunk.get('chunk_index', 0),
                        'page_num':    page_data['page_num'],
                        'filename':    source.pdf_filename,
                    },
                )
                saved += 1
                time.sleep(0.05)

        # Delete the physical file — chunks are all we need
        source.delete_pdf_file()

        return saved, ''

    except Exception as e:
        return 0, f'PDF extraction failed: {str(e)}'


# ── Similarity search ─────────────────────────────────────

def search_chunks(query: str, top_k: int = TOP_K) -> list[str]:
    """
    Find the most relevant chunks for a query using cosine similarity.
    Only searches chunks from active sources.
    Returns list of content strings ready to inject into the system prompt.
    """
    from .models import CrawlChunk

    query_embedding = get_embedding(query)
    if not query_embedding:
        return []

    # Load only active source chunks that have embeddings
    chunks = CrawlChunk.objects.filter(
        source__active=True,
        source__status='indexed',
    ).exclude(embedding=[]).values('id', 'content', 'page_title', 'embedding')

    if not chunks:
        return []

    # Score each chunk
    scored = []
    for chunk in chunks:
        score = cosine_similarity(query_embedding, chunk['embedding'])
        if score > 0.15:   # minimum relevance threshold
            scored.append((score, chunk))

    # Sort by score descending, return top_k
    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:top_k]

    results = []
    for score, chunk in top:
        title   = chunk['page_title']
        content = chunk['content']
        label   = f'[{title}]\n{content}' if title else content
        results.append(label)

    return results