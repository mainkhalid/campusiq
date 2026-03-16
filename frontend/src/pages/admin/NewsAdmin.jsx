import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Loader2, X, Upload,
  Globe, RefreshCw, Check, AlertTriangle, ChevronDown,
  ChevronUp, ExternalLink, Calendar, Tag, User
} from 'lucide-react'
import { toast } from 'sonner'
import { useApiWithUpload } from '../../hooks/useApiWithUpload'
import api from '../../api/axios'

const INITIAL_FORM = {
  title: '', content: '', category: 'news', author: '',
  event_date: '', external_link: '', tags: '', thumbnail: null,
}

const CATEGORY_STYLE = {
  news:         'bg-blue-100 text-blue-700',
  event:        'bg-purple-100 text-purple-700',
  announcement: 'bg-amber-100 text-amber-700',
}

// ── Scrape Panel ─────────────────────────────────────────────
function ScrapePanel({ onImported }) {
  const [phase, setPhase]             = useState('idle')   // idle | scraping | review | confirming | done
  const [articles, setArticles]       = useState([])
  const [selected, setSelected]       = useState(new Set())
  const [errors, setErrors]           = useState([])
  const [result, setResult]           = useState(null)
  const [expanded, setExpanded]       = useState(null)

  const handleScrape = async () => {
    setPhase('scraping')
    setArticles([])
    setErrors([])
    setResult(null)
    try {
      const res = await api.post('/news/posts/scrape/', { action: 'scrape' })
      const { articles: found = [], errors: errs = [], new_count } = res.data
      setArticles(found)
      setErrors(errs)
      // Pre-select only new articles
      setSelected(new Set(
        found.map((_, i) => i).filter(i => !found[i].already_exists)
      ))
      setPhase('review')
      if (found.length === 0) {
        toast.info('No articles found on the pages')
      } else {
        toast.success(`Found ${found.length} articles (${new_count} new)`)
      }
    } catch (e) {
      toast.error('Scrape failed: ' + (e.response?.data?.error || e.message))
      setPhase('idle')
    }
  }

  const toggleSelect = (i) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleConfirm = async () => {
    if (selected.size === 0) { toast.warning('Select at least one article'); return }
    setPhase('confirming')
    try {
      const toSave = [...selected].map(i => articles[i])
      const res = await api.post('/news/posts/scrape/', { action: 'confirm', articles: toSave })
      setResult(res.data)
      setPhase('done')
      toast.success(`Imported ${res.data.saved} articles successfully`)
      onImported()
    } catch (e) {
      toast.error('Failed to save articles')
      setPhase('review')
    }
  }

  const reset = () => {
    setPhase('idle')
    setArticles([])
    setSelected(new Set())
    setErrors([])
    setResult(null)
    setExpanded(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Scrape from Zetech Website</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Imports from zetech.ac.ke/z-news and zetech.ac.ke/latest-events
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase !== 'idle' && (
            <button onClick={reset}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              Reset
            </button>
          )}
          <button
            onClick={phase === 'idle' || phase === 'done' ? handleScrape : undefined}
            disabled={phase === 'scraping' || phase === 'confirming'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {phase === 'scraping'
              ? <><Loader2 size={15} className="animate-spin" /> Scraping...</>
              : <><RefreshCw size={15} /> {phase === 'done' ? 'Scrape Again' : 'Scrape Now'}</>
            }
          </button>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          <p className="font-bold mb-1 flex items-center gap-1.5">
            <AlertTriangle size={12} /> Partial errors
          </p>
          {errors.map((e, i) => <p key={i} className="opacity-80">{e}</p>)}
        </div>
      )}

      {/* Done result */}
      {phase === 'done' && result && (
        <div className="mx-6 my-4 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <Check size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-emerald-800 text-sm">Import complete</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {result.saved} articles imported · {result.skipped} skipped
              {result.errors?.length > 0 && ` · ${result.errors.length} errors`}
            </p>
            {result.errors?.length > 0 && (
              <ul className="mt-2 text-[11px] text-amber-700 space-y-0.5">
                {result.errors.map((e, i) => <li key={i} className="opacity-80">• {e}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Review list */}
      {phase === 'review' && articles.length > 0 && (
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {selected.size} of {articles.length} selected
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSelected(new Set(articles.map((_, i) => i).filter(i => !articles[i].already_exists)))}
                className="text-xs text-indigo-600 hover:underline font-semibold">
                Select new
              </button>
              <span className="text-slate-300">·</span>
              <button onClick={() => setSelected(new Set())}
                className="text-xs text-slate-400 hover:underline font-semibold">
                None
              </button>
            </div>
          </div>

          {articles.map((a, i) => (
            <div key={i}
              className={`border rounded-xl overflow-hidden transition-all ${
                selected.has(i) ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-white'
              } ${a.already_exists ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3 p-4">
                {/* Checkbox */}
                <button
                  onClick={() => !a.already_exists && toggleSelect(i)}
                  disabled={a.already_exists}
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    a.already_exists
                      ? 'border-slate-200 bg-slate-100 cursor-not-allowed'
                      : selected.has(i)
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-slate-300 bg-white hover:border-indigo-400'
                  }`}>
                  {selected.has(i) && !a.already_exists && <Check size={11} className="text-white" />}
                </button>

{/* Thumbnail intentionally omitted — AI-extracted URLs are unreliable */}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${CATEGORY_STYLE[a.category] || 'bg-slate-100 text-slate-500'}`}>
                      {a.category}
                    </span>
                    {a.already_exists && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                        Already imported
                      </span>
                    )}
                    {a.event_date && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar size={10} />{a.event_date}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-tight line-clamp-1">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.content}</p>

                  {/* Tags */}
                  {a.tags?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {a.tags.slice(0, 4).map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0">
                  {expanded === i ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>

              {/* Expanded detail */}
              {expanded === i && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
                  {a.external_link && (
                    <a href={a.external_link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-indigo-500 hover:underline">
                      <ExternalLink size={11} /> {a.external_link}
                    </a>
                  )}
                  {a.source_url && (
                    <p className="text-[10px] text-slate-400">Source: {a.source_url}</p>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0 || phase === 'confirming'}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
              {phase === 'confirming'
                ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                : <><Check size={14} /> Import {selected.size} Article{selected.size !== 1 ? 's' : ''}</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
const NewsAdmin = () => {
  // Use hook only for mutations (create/update/delete) — it handles toast/refetch
  const {
    createWithFile, updateWithFile, remove,
  } = useApiWithUpload('/news/posts/')

  // Fetch list directly so we can handle paginated { count, results } OR plain array
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await api.get('/news/posts/')
      const body = res.data
      // DRF paginated: { count, results: [...] }  OR plain array
      const list = Array.isArray(body) ? body : (body.results ?? body.data ?? [])
      setPosts(list)
    } catch (e) {
      console.error('Failed to fetch posts:', e)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const [showForm, setShowForm]     = useState(false)
  const [showScrape, setShowScrape] = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [formData, setFormData]     = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFormData(prev => ({ ...prev, thumbnail: file }))
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title',         formData.title)
      fd.append('content',       formData.content)
      fd.append('category',      formData.category)
      fd.append('author',        formData.author)
      fd.append('external_link', formData.external_link)
      if (formData.event_date) fd.append('event_date', formData.event_date)
      if (formData.thumbnail instanceof File) fd.append('thumbnail', formData.thumbnail)
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : []
      fd.append('tags', JSON.stringify(tagsArray))
      if (editingId) { await updateWithFile(editingId, fd) }
      else           { await createWithFile(fd) }
      await fetchData()
      resetForm()
    } catch {
      // handled in hook
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (post) => {
    setEditingId(post.id)
    setShowForm(true)
    setShowScrape(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const res  = await api.get(`/news/posts/${post.id}/`)
      const full = res.data
      setFormData({
        title:         full.title         || '',
        content:       full.content       || '',
        category:      full.category      || 'news',
        author:        full.author        || '',
        event_date:    full.event_date    || '',
        external_link: full.external_link || '',
        tags:          Array.isArray(full.tags) ? full.tags.join(', ') : '',
        thumbnail:     null,
      })
      const thumbUrl = full.thumbnail_url
        || (typeof full.thumbnail === 'object' && full.thumbnail?.url)
        || null
      setPreviewUrl(thumbUrl)
    } catch {
      toast.error('Failed to load post details')
      resetForm()
    }
  }

  const handleTogglePublish = async (post) => {
    try {
      await api.patch(`/news/posts/${post.id}/publish/`)
      toast.success(`Post ${post.status === 'published' ? 'unpublished' : 'published'}`)
      fetchData()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return
    await remove(id)
    fetchData()
  }

  const resetForm = () => {
    setFormData(INITIAL_FORM)
    setEditingId(null)
    setShowForm(false)
    setPreviewUrl(null)
  }

  const inputCls = "w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 outline-none bg-white transition-all"
  const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5"

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1a2b4c]">News & Events</h1>
          <p className="text-sm text-slate-400 mt-1">Manage posts displayed on the website</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowScrape(!showScrape); resetForm() }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              showScrape
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            <Globe size={16} />
            {showScrape ? 'Hide Scraper' : 'Scrape Website'}
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); setShowScrape(false) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2b4c] text-white rounded-xl text-sm font-bold hover:bg-[#243660] transition-all shadow-sm"
          >
            <Plus size={16} /> New Post
          </button>
        </div>
      </div>

      {/* Scrape panel */}
      {showScrape && (
        <ScrapePanel onImported={() => { fetchData(); setShowScrape(false) }} />
      )}

      {/* Manual form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base">
              {editingId ? 'Edit Post' : 'New Post'}
            </h2>
            <button onClick={resetForm}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelCls}>Title *</label>
                <input name="title" value={formData.title} onChange={handleChange} required
                  className={inputCls} placeholder="Post title" />
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className={inputCls}>
                  <option value="news">News</option>
                  <option value="event">Event</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Author</label>
                <input name="author" value={formData.author} onChange={handleChange}
                  className={inputCls} placeholder="Author name" />
              </div>

              {formData.category === 'event' && (
                <div>
                  <label className={labelCls}>Event Date</label>
                  <input type="date" name="event_date" value={formData.event_date}
                    onChange={handleChange} className={inputCls} />
                </div>
              )}

              <div>
                <label className={labelCls}>External Link</label>
                <input name="external_link" value={formData.external_link} onChange={handleChange}
                  className={inputCls} placeholder="https://..." />
              </div>

              <div>
                <label className={labelCls}>Tags (comma separated)</label>
                <input name="tags" value={formData.tags} onChange={handleChange}
                  className={inputCls} placeholder="technology, research, awards" />
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Content *</label>
                <textarea name="content" value={formData.content} onChange={handleChange}
                  required rows={6}
                  className={inputCls + ' resize-none leading-relaxed'}
                  placeholder="Write the full post content here..." />
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Thumbnail</label>
                <div className="flex items-start gap-4">
                  <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                    <Upload size={15} className="text-slate-400" />
                    <span className="text-sm text-slate-500 font-medium">
                      {previewUrl ? 'Replace image' : 'Choose image'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  </label>
                  {previewUrl && (
                    <div className="relative">
                      <img src={previewUrl} alt="Preview"
                        className="w-24 h-16 object-cover rounded-xl border border-slate-200" />
                      <button type="button"
                        onClick={() => { setPreviewUrl(null); setFormData(p => ({ ...p, thumbnail: null })) }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm">
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
              <button type="button" onClick={resetForm}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-[#1a2b4c] text-white rounded-xl text-sm font-bold hover:bg-[#243660] disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm">
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {editingId ? 'Save Changes' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Globe size={36} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm font-semibold text-slate-400">No posts yet</p>
          <p className="text-xs text-slate-300 mt-1">Create one manually or use the website scraper</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              {post.thumbnail_url ? (
                <img src={post.thumbnail_url} alt={post.title}
                  className="w-20 h-14 object-cover rounded-xl flex-shrink-0 border border-slate-100" />
              ) : (
                <div className="w-20 h-14 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-100">
                  <Globe size={18} className="text-slate-300" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${CATEGORY_STYLE[post.category] || 'bg-slate-100 text-slate-500'}`}>
                    {post.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {post.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 truncate text-sm">{post.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  {post.author && (
                    <span className="flex items-center gap-1">
                      <User size={10} />{post.author}
                    </span>
                  )}
                  <span>{new Date(post.created_at).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => handleTogglePublish(post)}
                  title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                  className={`p-2 rounded-lg transition-colors ${
                    post.status === 'published'
                      ? 'text-emerald-600 hover:bg-emerald-50'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}>
                  {post.status === 'published' ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => handleEdit(post)}
                  className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(post.id)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NewsAdmin