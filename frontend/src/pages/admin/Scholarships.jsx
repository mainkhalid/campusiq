import React, { useState } from 'react'
import {
  Plus, Trash2, Save, Eye, Loader2,
  DollarSign, GraduationCap, Info, Upload, X, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useApiWithUpload } from '../../hooks/useApiWithUpload'
import api from '../../api/axios'

const initialState = {
  name:            '',
  provider:        '',
  amount:          '',
  deadline:        '',
  eligibility:     'Open to All',
  description:     '',
  requirements:    [''],
  tags:            [''],
  application_url: '',
  contact_email:   '',
  thumbnail:       null,
}

const ScholarshipAdmin = () => {
  const {
    data:           scholarships,
    loading:        fetching,
    fetchData:      fetchScholarships,
    createWithFile,
    updateWithFile,
    remove,
  } = useApiWithUpload('/scholarships/scholarships/')

  const [loading, setLoading]                   = useState(false)
  const [formData, setFormData]                 = useState(initialState)
  const [isEditing, setIsEditing]               = useState(false)
  const [editingId, setEditingId]               = useState(null)
  const [isPreview, setIsPreview]               = useState(false)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [showForm, setShowForm]                 = useState(false)

  // ── Form handlers ────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size should be less than 5MB'); return }
    setFormData(prev => ({ ...prev, thumbnail: file }))
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const removeThumbnail = () => {
    setFormData(prev => ({ ...prev, thumbnail: null }))
    setThumbnailPreview(null)
  }

  const handleRequirementChange = (index, value) => {
    const updated = [...formData.requirements]
    updated[index] = value
    setFormData(prev => ({ ...prev, requirements: updated }))
  }

  const handleTagChange = (index, value) => {
    const updated = [...formData.tags]
    updated[index] = value
    setFormData(prev => ({ ...prev, tags: updated }))
  }

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const filteredRequirements = formData.requirements.map(r => r.trim()).filter(Boolean)
    const filteredTags         = formData.tags.map(t => t.trim()).filter(Boolean)

    if (filteredRequirements.length === 0) {
      toast.error('Please add at least one requirement')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      ;['name', 'provider', 'amount', 'deadline', 'eligibility', 'description',
        'application_url', 'contact_email'].forEach(key => {
        if (formData[key] != null) fd.append(key, formData[key])
      })
      fd.append('requirements', JSON.stringify(filteredRequirements))
      fd.append('tags',         JSON.stringify(filteredTags))
      if (formData.thumbnail instanceof File) fd.append('thumbnail', formData.thumbnail)

      if (isEditing) {
        await updateWithFile(editingId, fd)
      } else {
        await createWithFile(fd)
      }
      resetForm()
    } catch {
      // toast handled in hook
    } finally {
      setLoading(false)
    }
  }

  // ── Edit — fetch full detail (list serializer omits description/requirements) ──
  const editScholarship = async (scholarship) => {
    setIsEditing(true)
    setEditingId(scholarship.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const res  = await api.get(`/scholarships/scholarships/${scholarship.id}/`)
      const full = res.data
      setFormData({
        name:            full.name            || '',
        provider:        full.provider        || '',
        amount:          full.amount          || '',
        deadline:        full.deadline
          ? new Date(full.deadline).toISOString().split('T')[0] : '',
        eligibility:     full.eligibility     || 'Open to All',
        description:     full.description     || '',
        requirements:    full.requirements?.length > 0 ? full.requirements : [''],
        tags:            full.tags?.length    > 0 ? full.tags            : [''],
        application_url: full.application_url || '',
        contact_email:   full.contact_email   || '',
        thumbnail:       null,
      })
      setThumbnailPreview(
        full.thumbnail_url
        || (typeof full.thumbnail === 'object' && full.thumbnail?.url)
        || null
      )
    } catch {
      toast.error('Failed to load scholarship details')
      resetForm()
    }
  }

  // ── Delete ───────────────────────────────────────────────
  const deleteScholarship = async (id) => {
    if (!window.confirm('Delete this scholarship?')) return
    await remove(id)
  }

  // ── Publish toggle ───────────────────────────────────────
  const togglePublish = async (id) => {
    try {
      const res = await api.patch(`/scholarships/scholarships/${id}/publish/`)
      toast.success(res.data.message || 'Status updated')
      fetchScholarships()
    } catch {
      toast.error('Failed to update status')
    }
  }

  // ── Reset ────────────────────────────────────────────────
  const resetForm = () => {
    setFormData(initialState)
    setIsEditing(false)
    setEditingId(null)
    setIsPreview(false)
    setThumbnailPreview(null)
    setShowForm(false)
  }

  // ── Preview ──────────────────────────────────────────────
  const renderPreview = () => (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100">
      <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Financial Aid
          </span>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            {formData.name || 'SCHOLARSHIP NAME'}
          </h2>
          <p className="text-indigo-600 font-semibold">{formData.provider || 'PROVIDER NAME'}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs font-bold uppercase">Deadline</p>
          <p className="text-red-500 font-bold">{formData.deadline || 'TBA'}</p>
        </div>
      </div>
      {thumbnailPreview && (
        <img src={thumbnailPreview} alt="Scholarship preview"
          className="w-full h-48 object-cover rounded-lg mb-6" />
      )}
      <div className="mb-6 flex gap-4">
        <div className="flex items-center gap-2">
          <DollarSign className="text-green-500" size={20} />
          <span className="font-bold text-slate-700">{formData.amount || 'Amount TBA'}</span>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="text-blue-500" size={20} />
          <span className="text-slate-600">{formData.eligibility}</span>
        </div>
      </div>
      {formData.description && (
        <div className="mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
            <Info size={18} className="text-indigo-500" /> Description
          </h3>
          <p className="text-slate-600 leading-relaxed">{formData.description}</p>
        </div>
      )}
      {formData.requirements.filter(r => r.trim()).length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-slate-800 mb-3">Requirements</h3>
          <ul className="space-y-2">
            {formData.requirements.filter(r => r.trim()).map((req, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                <span className="text-slate-600">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {formData.tags.filter(t => t.trim()).length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {formData.tags.filter(t => t.trim()).map((tag, i) => (
            <span key={i} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
              {tag}
            </span>
          ))}
        </div>
      )}
      {(formData.application_url || formData.contact_email) && (
        <div className="border-t border-slate-100 pt-6 mt-6">
          {formData.application_url && (
            <a href={formData.application_url} target="_blank" rel="noopener noreferrer"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 mb-2">
              Apply Now
            </a>
          )}
          {formData.contact_email && (
            <p className="text-sm text-slate-600">Contact: {formData.contact_email}</p>
          )}
        </div>
      )}
    </div>
  )

  // ── Form ─────────────────────────────────────────────────
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Scholarship Name *', name: 'name',     type: 'text',  required: true },
          { label: 'Provider *',         name: 'provider', type: 'text',  required: true },
          { label: 'Amount *',           name: 'amount',   type: 'text',  required: true, placeholder: 'e.g., KES 50,000' },
          { label: 'Deadline *',         name: 'deadline', type: 'date',  required: true },
        ].map(({ label, name, type, required, placeholder }) => (
          <div key={name}>
            <label className="block font-bold text-slate-800 mb-2">{label}</label>
            <input type={type} name={name} value={formData[name]} onChange={handleChange}
              required={required} placeholder={placeholder}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        ))}
        <div>
          <label className="block font-bold text-slate-800 mb-2">Eligibility *</label>
          <select name="eligibility" value={formData.eligibility} onChange={handleChange}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" required>
            {['Open to All','Undergraduate Only','Graduate Only','International Students',
              'Domestic Students Only','STEM Students','Arts & Humanities',
              'First Year Students','Final Year Students','Need-Based','Merit-Based'
            ].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-800 mb-2">Application URL</label>
          <input type="url" name="application_url" value={formData.application_url}
            onChange={handleChange} placeholder="https://..."
            className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div className="md:col-span-2">
          <label className="block font-bold text-slate-800 mb-2">Contact Email</label>
          <input type="email" name="contact_email" value={formData.contact_email}
            onChange={handleChange} placeholder="contact@example.com"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>

      {/* Thumbnail */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Upload size={18} className="text-indigo-500" /> Thumbnail Image
        </h2>
        {thumbnailPreview ? (
          <div className="relative inline-block">
            <img src={thumbnailPreview} alt="Preview"
              className="w-full max-w-md h-48 object-cover rounded-lg" />
            <button type="button" onClick={removeThumbnail}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600">
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
            <Upload className="text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">Click to upload thumbnail</span>
            <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
          </label>
        )}
      </div>

      {/* Description */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Info size={18} className="text-indigo-500" /> Description
        </h2>
        <textarea name="description" value={formData.description} onChange={handleChange}
          rows={6} required placeholder="Describe the scholarship..."
          className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>

      {/* Requirements */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="font-bold text-slate-800 mb-2">Application Requirements *</h2>
        <p className="text-sm text-slate-500 mb-4">Add each requirement as a separate item.</p>
        <div className="space-y-2">
          {formData.requirements.map((req, index) => (
            <div key={index} className="flex gap-2">
              <input value={req} onChange={(e) => handleRequirementChange(index, e.target.value)}
                className="flex-1 border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder={`Requirement ${index + 1}`} />
              {formData.requirements.length > 1 && (
                <button type="button"
                  onClick={() => setFormData(prev => ({ ...prev, requirements: prev.requirements.filter((_, i) => i !== index) }))}
                  className="p-2 text-red-400 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button type="button"
            onClick={() => setFormData(prev => ({ ...prev, requirements: [...prev.requirements, ''] }))}
            className="mt-2 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700">
            <Plus size={16} /> Add Requirement
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="font-bold text-slate-800 mb-4">Tags</h2>
        <div className="space-y-2">
          {formData.tags.map((tag, index) => (
            <div key={index} className="flex gap-2">
              <input value={tag} onChange={(e) => handleTagChange(index, e.target.value)}
                className="flex-1 border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder={`Tag ${index + 1}`} />
              {formData.tags.length > 1 && (
                <button type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }))}
                  className="p-2 text-red-400 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button type="button"
            onClick={() => setFormData(prev => ({ ...prev, tags: [...prev.tags, ''] }))}
            className="mt-2 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700">
            <Plus size={16} /> Add Tag
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={resetForm}
          className="px-6 py-3 border border-slate-300 rounded-lg font-bold hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-10 py-3 rounded-lg font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
            : <><Save size={18} /> {isEditing ? 'Update Scholarship' : 'Create Scholarship'}</>
          }
        </button>
      </div>
    </form>
  )

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Scholarship Management</h1>
            <p className="text-slate-500">Create and manage scholarship opportunities</p>
          </div>
          <div className="flex gap-2">
            {!showForm && (
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                <Plus size={18} /> Add Scholarship
              </button>
            )}
            {showForm && (
              <button onClick={() => setIsPreview(!isPreview)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                  isPreview ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border'
                }`}>
                <Eye size={18} /> {isPreview ? 'Edit' : 'Preview'}
              </button>
            )}
            <button onClick={fetchScholarships} disabled={fetching}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw size={15} className={fetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-10">
            {isPreview ? renderPreview() : renderForm()}
          </div>
        )}

        {/* List */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            All Scholarships
            {!fetching && <span className="text-sm font-normal text-slate-400 ml-2">({scholarships.length})</span>}
          </h2>
          {fetching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
          ) : scholarships.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No scholarships yet. Create your first one above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scholarships.map((s) => (
                <div key={s.id} className="bg-white rounded-xl p-6 shadow-sm border">
                  {s.thumbnail_url && (
                    <img src={s.thumbnail_url} alt={s.name}
                      className="w-full h-32 object-cover rounded-lg mb-4" />
                  )}
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{s.name}</h3>
                  <p className="text-sm text-slate-600 mb-1">{s.provider}</p>
                  <p className="text-sm text-indigo-600 font-semibold mb-1">{s.amount}</p>
                  <p className="text-xs text-slate-500 mb-3">
                    Deadline: {new Date(s.deadline).toLocaleDateString('en-KE', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                  {s.requirements?.length > 0 && (
                    <p className="text-xs text-slate-400 mb-3">{s.requirements.length} requirement(s)</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => editScholarship(s)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded font-semibold text-sm hover:bg-blue-100">
                      Edit
                    </button>
                    <button onClick={() => togglePublish(s.id)}
                      className={`flex-1 px-3 py-2 rounded font-semibold text-sm ${
                        s.published ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}>
                      {s.published ? 'Published' : 'Draft'}
                    </button>
                    <button onClick={() => deleteScholarship(s.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScholarshipAdmin