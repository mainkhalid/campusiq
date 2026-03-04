import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, X, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useApiWithUpload } from '../../hooks/useApiWithUpload'
import api from '../../api/axios'

const INITIAL_FORM = {
  title:         '',
  content:       '',
  category:      'news',
  author:        '',
  event_date:    '',
  external_link: '',
  tags:          '',
  thumbnail:     null,
}

const NewsAdmin = () => {
  const {
    data: posts,
    loading,
    fetchData,
    createWithFile,
    updateWithFile,
    remove,
  } = useApiWithUpload('/news/posts/')

  const [showForm, setShowForm]     = useState(false)
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
      // Only append thumbnail if user selected a new file — never send the old dict
      if (formData.thumbnail instanceof File) {
        fd.append('thumbnail', formData.thumbnail)
      }
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : []
      fd.append('tags', JSON.stringify(tagsArray))

      if (editingId) {
        await updateWithFile(editingId, fd)
      } else {
        await createWithFile(fd)
      }
      resetForm()
    } catch {
      // toast handled in hook
    } finally {
      setSubmitting(false)
    }
  }

  // Fetch full detail on edit — list serializer omits content, external_link etc.
  // Also avoids sending the thumbnail dict as a file (causes 'dict has no attr name')
  const handleEdit = async (post) => {
    setEditingId(post.id)
    setShowForm(true)
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
        thumbnail:     null,  // ✅ never put the dict here — only File objects allowed
      })
      // Resolve thumbnail preview from all possible sources
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
  }

  const resetForm = () => {
    setFormData(INITIAL_FORM)
    setEditingId(null)
    setShowForm(false)
    setPreviewUrl(null)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">News & Events</h1>
            <p className="text-slate-500 text-sm">Manage posts displayed on the website</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all"
          >
            <Plus size={18} /> New Post
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-slate-800">
                {editingId ? 'Edit Post' : 'New Post'}
              </h2>
              <button onClick={resetForm}>
                <X size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Title *</label>
                  <input name="title" value={formData.title} onChange={handleChange} required
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Post title" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="news">News</option>
                    <option value="event">Event</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Author</label>
                  <input name="author" value={formData.author} onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Author name" />
                </div>

                {formData.category === 'event' && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Event Date</label>
                    <input type="date" name="event_date" value={formData.event_date}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">External Link</label>
                  <input name="external_link" value={formData.external_link} onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://..." />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tags (comma separated)</label>
                  <input name="tags" value={formData.tags} onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="technology, research, awards" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Content *</label>
                  <textarea name="content" value={formData.content} onChange={handleChange}
                    required rows={6}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Write the full post content here..." />
                </div>

                {/* Thumbnail */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Thumbnail</label>
                  <div className="flex items-start gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
                      <Upload size={16} className="text-slate-400" />
                      <span className="text-sm text-slate-500">
                        {previewUrl ? 'Replace image' : 'Choose image'}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                    </label>
                    {previewUrl && (
                      <div className="relative">
                        <img src={previewUrl} alt="Preview"
                          className="w-24 h-16 object-cover rounded-lg border" />
                        <button
                          type="button"
                          onClick={() => { setPreviewUrl(null); setFormData(prev => ({ ...prev, thumbnail: null })) }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            No posts yet. Create your first one above.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
                {post.thumbnail_url ? (
                  <img src={post.thumbnail_url} alt={post.title}
                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-20 h-14 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-300 text-xs">
                    No img
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      post.category === 'news'         ? 'bg-blue-100 text-blue-700'   :
                      post.category === 'event'        ? 'bg-purple-100 text-purple-700' :
                                                         'bg-amber-100 text-amber-700'
                    }`}>
                      {post.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 truncate">{post.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {post.author && `By ${post.author} · `}
                    {new Date(post.created_at).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleTogglePublish(post)}
                    title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                    className={`p-2 rounded-lg transition-colors ${
                      post.status === 'published' ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50'
                    }`}>
                    {post.status === 'published' ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => handleEdit(post)}
                    className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors">
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
    </div>
  )
}

export default NewsAdmin