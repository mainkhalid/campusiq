# CampusIQ — University AI Assistant

An AI-powered chatbot for universities built with Django and React. Answers student questions about programmes, fees, timetables, scholarships, and more — using RAG (Retrieval-Augmented Generation) with both internal database knowledge and externally crawled website content.

---
### Student-Facing
- **AI Chat Widget** — floating chat widget with typing indicators, topic tracking, and WhatsApp fallback
- **Programme Search** — answers questions about courses, entry requirements, and fees from the database
- **Timetable Lookup** — finds class schedules by programme group, unit code, lecturer, or room
-  **RAG Knowledge Base** — crawls university website pages and indexes PDFs for questions the DB doesn't cover
- **News & Events** — live news feed scraped from the university website with category filtering
- **AI-Powered Pages** — Admissions, Student Life, and Research pages pull content from the knowledge base
- **Context-Aware Conversations** — topic tracker maintains context across follow-up questions
 
### Admin Panel
-  **Analytics Dashboard** — chat volume charts, topic breakdown, daily/weekly stats
-  **AI Settings** — configure models, temperature, greeting message, data source toggles
-  **Chat Logs** — browse full conversation transcripts, delete sessions
-  **Knowledge Sources** — add/crawl websites, upload PDFs, view indexed chunks
- **Content Management** — programmes, FAQs, scholarships, research projects, timetables, news
- **News Scraper** — two-step preview-and-confirm import from the university website
- **Programme Importer** — AI-assisted dual-source scraper for programme catalogue
 
### Architecture
- ⚡ **Dual Model Strategy** — fast model for simple queries, precise model for data-heavy responses
- **Hybrid Routing** — structured DB for programmes/fees, semantic search for general knowledge
-  **Client-Side Prefetch Cache** — `ChunkDataContext` prefetches AI content on app load, zero wait on page visit
- **JWT Authentication** — access + refresh token rotation for admin routes

---

## Tech Stack

**Backend**
- Python 3.12, Django 5, Django REST Framework
- SQLite (dev) / PostgreSQL (prod)
- `sentence-transformers` — local embeddings (dev)
- `pdfplumber` — PDF text extraction
- `BeautifulSoup4` — website crawling
- OpenRouter API — LLM inference



## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
OPENROUTER_API_KEY=your_key_here
SECRET_KEY=your_django_secret_key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
```

---

## AI Configuration

The AI behaviour is fully configurable from the admin panel at `/admin`:

| Setting | Description |
|---|---|
| Greeting Message | First message students see in the chat widget |
| Use Programmes | Include programme data in AI responses |
| Use FAQs | Include FAQ data in AI responses |
| Use Timetable | Enable timetable lookups |
| Use Scholarships | Include scholarship data |
| Use External Sources | Enable crawled website/PDF knowledge base |
| Custom System Prompt | Override or extend AI instructions |
| Temperature | Control response creativity (0.0–1.0) |

---

## External Knowledge Base

The crawler indexes external university website pages and PDFs to answer questions the internal database doesn't cover (e.g. live tuition fee tables).

**Adding a source:**
1. Go to AIAdmin → External Sources
2. Add a URL (website/sitemap) or upload a PDF
3. Set crawl depth (1–3 levels)
4. Indexing runs in the background automatically

**How it works:**
```
URL/PDF → crawl/extract text → chunk (~800 chars) → embed → store in DB
Query → embed query → cosine similarity → top 15 chunks → inject into prompt
```

**Switching to production embeddings:**
```python
# In crawler/crawler_service.py
EMBED_BACKEND = 'openrouter'
EMBED_MODEL   = 'qwen/qwen3-embedding-0.6b'   
```

---

## Models

| Role | Model | Used when |
|---|---|---|
| Fast | `arcee-ai/trinity-mini:free` | Greetings, simple queries |
| Smart | `arcee-ai/trinity-large-preview:free` | External chunks present |
| Embeddings (dev) | `all-MiniLM-L6-v2` | Local, free, CPU |
| Embeddings (prod) | `qwen/qwen3-embedding-0.6b` | OpenRouter API |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/aibot/chat/` | Send a message, receive AI response |
| GET | `/api/aibot/quick-actions/` | Fetch quick action buttons |
| GET/POST | `/api/crawler/sources/` | List / add crawl sources |
| POST | `/api/crawler/sources/{id}/crawl/` | Trigger re-crawl |
| PATCH | `/api/crawler/sources/{id}/toggle/` | Toggle source active/inactive |
| POST | `/api/crawler/test-query/` | Test query against knowledge base |
| GET | `/api/aiconfig/settings/` | Get AI settings |

---
#steps to restore database
createdb -U postgres zetechdb
pg_restore -U postgres -d zetechdb zetechdb.dump
