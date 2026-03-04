import React, { useState, useRef } from 'react'
import { 
  Plus, Trash2, Save, Microscope, 
  FileText, User, Eye, EyeOff, Activity, FlaskConical, Target, Upload, X, 
  Image as ImageIcon, Loader2, Edit2, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useApiWithUpload } from '../../hooks/useApiWithUpload'
import api from '../../api/axios'

const initialState = {
  title:         '',
  lead:          '',
  department:    'Sciences',
  funding:       '',
  status:        'Planning',
  abstract:      '',
  milestones:    [''],
  thumbnail:     null,
  thumbnailPreview: null,
  tags:          [],
  collaborators: []
}

const ResearchAdmin = () => {
  const {
    data:           projects,
    loading:        fetching,
    fetchData:      fetchProjects,
    createWithFile,
    updateWithFile,
    remove,
    patch,
  } = useApiWithUpload('/research/projects/')

  const [loading, setLoading]     = useState(false)
  const [data, setData]           = useState(initialState)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const fileInputRef              = useRef(null)

  // ── Form handlers ───────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleMilestoneChange = (index, value) => {
    const newM = [...data.milestones]
    newM[index] = value
    setData(prev => ({ ...prev, milestones: newM }))
  }
  const addMilestone    = () => setData(prev => ({ ...prev, milestones: [...prev.milestones, ''] }))
  const removeMilestone = (index) => setData(prev => ({
    ...prev, milestones: prev.milestones.filter((_, i) => i !== index)
  }))

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return }
    if (file.size > 5 * 1024 * 1024)    { toast.error('Image size should be less than 5MB'); return }
    setData(prev => ({ ...prev, thumbnail: file, thumbnailPreview: URL.createObjectURL(file) }))
  }

  const removeImage = () => {
    if (data.thumbnailPreview && data.thumbnail) URL.revokeObjectURL(data.thumbnailPreview)
    setData(prev => ({ ...prev, thumbnail: null, thumbnailPreview: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Build FormData ──────────────────────────────────────
  const buildFormData = () => {
    const fd = new FormData()
    fd.append('title',      data.title)
    fd.append('lead',       data.lead)
    fd.append('department', data.department)
    fd.append('funding',    data.funding)
    fd.append('status',     data.status)
    fd.append('abstract',   data.abstract)
    const milestonesArray = data.milestones
      .filter(m => m.trim() !== '')
      .map(m => ({ description: m, completed: false }))
    fd.append('milestones', JSON.stringify(milestonesArray))
    if (data.tags?.length)          fd.append('tags',          JSON.stringify(data.tags))
    if (data.collaborators?.length) fd.append('collaborators', JSON.stringify(data.collaborators))
    if (data.thumbnail instanceof File) fd.append('thumbnail', data.thumbnail)
    return fd
  }

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = buildFormData()
      if (editingId) {
        await updateWithFile(editingId, fd)
      } else {
        await createWithFile(fd)
      }
      if (data.thumbnailPreview && data.thumbnail) URL.revokeObjectURL(data.thumbnailPreview)
      resetForm()
    } catch {
      // toast handled in hook
    } finally {
      setLoading(false)
    }
  }

  // ── Edit — fetch full detail (list serializer omits abstract/funding/milestones) ──
  const handleEdit = async (project) => {
    setEditingId(project.id)
    setShowForm(true)
    setIsPreview(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const res  = await api.get(`/research/projects/${project.id}/`)
      const full = res.data
      setData({
        title:            full.title         || '',
        lead:             full.lead          || '',
        department:       full.department    || 'Sciences',
        funding:          full.funding       || '',
        status:           full.status        || 'Planning',
        abstract:         full.abstract      || '',
        milestones:       full.milestones?.map(m => m.description) || [''],
        tags:             full.tags          || [],
        collaborators:    full.collaborators || [],
        thumbnail:        null,
        thumbnailPreview: full.thumbnail_url
          || (typeof full.thumbnail === 'object' && full.thumbnail?.url)
          || null,
      })
    } catch {
      toast.error('Failed to load project details')
      resetForm()
    }
  }

  // ── Delete ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this research project?')) return
    await remove(id)
  }

  // ── Toggle publish ──────────────────────────────────────
  const togglePublish = async (project) => {
    try {
      const res = await patch(project.id, {})  // view toggles server-side
      // hook's patch doesn't call a custom action, use api directly
      const r = await api.patch(`/research/projects/${project.id}/publish/`)
      toast.success(r.data.message || 'Status updated')
      fetchProjects()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const resetForm = () => {
    setData(initialState)
    setEditingId(null)
    setShowForm(false)
    setIsPreview(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Research & Innovation</h1>
            <p className="text-slate-500 text-sm">Publish and track ongoing academic research projects</p>
          </div>
          <div className="flex gap-2">
            {!showForm && (
              <button onClick={() => { resetForm(); setShowForm(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a2b4c] text-white rounded-lg font-semibold hover:bg-slate-800">
                <Plus size={18} /> Add Project
              </button>
            )}
            {showForm && (
              <button onClick={() => setIsPreview(!isPreview)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${
                  isPreview ? 'bg-[#1a2b4c] text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}>
                <Eye size={18} /> {isPreview ? 'Back to Edit' : 'Preview'}
              </button>
            )}
            <button onClick={fetchProjects} className="p-2 border rounded-lg text-slate-500 hover:bg-slate-50">
              <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Form / Preview */}
        {showForm && (
          isPreview ? (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 mb-8">
              {data.thumbnailPreview && (
                <div className="relative h-64 w-full overflow-hidden bg-slate-100">
                  <img src={data.thumbnailPreview} alt="Project thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}
              <div className="p-8 border-b border-slate-100 flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#2d4263] font-bold text-xs uppercase tracking-widest">
                    <Microscope size={14} /> Academic Research
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 leading-tight">{data.title || 'RESEARCH PROJECT TITLE'}</h2>
                  <div className="flex items-center gap-6 text-sm text-slate-500 font-medium pt-2">
                    <span className="flex items-center gap-1"><User size={14}/> {data.lead || 'Lead Investigator'}</span>
                    <span className="flex items-center gap-1"><FlaskConical size={14}/> {data.department}</span>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-rose-50 border border-rose-100 rounded-full text-[#2d4263] font-bold text-xs">
                  {data.status}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 p-8 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <FileText size={18} className="text-[#1a2b4c]" /> Abstract
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                      {data.abstract || 'Project abstract goes here...'}
                    </p>
                  </div>
                  {data.milestones.filter(m => m.trim()).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Target size={18} className="text-[#1a2b4c]" /> Key Milestones
                      </h3>
                      <div className="space-y-2">
                        {data.milestones.filter(m => m.trim()).map((m, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="w-2 h-2 rounded-full bg-[#1a2b4c] mt-1.5 flex-shrink-0" />
                            <p className="text-sm text-slate-600">{m}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 p-8 border-l border-slate-100 space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Financial Summary</h4>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Approved Funding</p>
                    <p className="text-2xl font-black text-slate-800">{data.funding || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 mb-10">
              {/* Thumbnail */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon size={18} className="text-[#1a2b4c]" /> Project Thumbnail
                </h2>
                <p className="text-xs text-slate-400">Recommended: 1200x800px · Max 5MB</p>
                {data.thumbnailPreview ? (
                  <div className="relative rounded-lg overflow-hidden border-2 border-slate-200 group">
                    <img src={data.thumbnailPreview} alt="Preview" className="w-full h-64 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button type="button" onClick={removeImage}
                        className="opacity-0 group-hover:opacity-100 transition-all bg-[#1a2b4c] text-white p-3 rounded-full hover:scale-110">
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors">
                        <Upload size={32} className="text-slate-400 group-hover:text-[#1a2b4c] transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">Click to upload thumbnail</p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>

              {/* Core details */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <Microscope size={18} className="text-[#1a2b4c]" /> Core Project Details
                  </h2>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Project Title *</label>
                  <input name="title" value={data.title} onChange={handleChange} required
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c] outline-none"
                    placeholder="e.g. AI Integration in Modern Healthcare Systems" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Lead Investigator *</label>
                  <input name="lead" value={data.lead} onChange={handleChange} required
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Department *</label>
                  <select name="department" value={data.department} onChange={handleChange}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c] outline-none">
                    <option value="Sciences">School of Sciences</option>
                    <option value="Tech">Information Technology</option>
                    <option value="Health">Health Sciences</option>
                    <option value="Arts">Humanities & Arts</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Funding Body / Amount</label>
                  <input name="funding" value={data.funding} onChange={handleChange}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c] outline-none"
                    placeholder="e.g. KES 500,000 - Research Fund" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Current Status</label>
                  <select name="status" value={data.status} onChange={handleChange}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c] outline-none">
                    <option value="Planning">Planning Phase</option>
                    <option value="Active">Active Research</option>
                    <option value="Peer Review">Under Peer Review</option>
                    <option value="Completed">Completed / Published</option>
                  </select>
                </div>
              </div>

              {/* Abstract & Milestones */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-rose-500" /> Abstract & Roadmap
                </h2>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Research Abstract</label>
                  <textarea name="abstract" value={data.abstract} onChange={handleChange} rows={5}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c] outline-none"
                    placeholder="Problem statement, methodology and hypothesis..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Project Milestones</label>
                  {data.milestones.map((milestone, index) => (
                    <div key={index} className="flex gap-2">
                      <input value={milestone} onChange={(e) => handleMilestoneChange(index, e.target.value)}
                        className="flex-1 border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c] outline-none"
                        placeholder={`Phase ${index + 1} goal...`} />
                      {data.milestones.length > 1 && (
                        <button type="button" onClick={() => removeMilestone(index)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addMilestone}
                    className="mt-2 flex items-center gap-2 text-sm font-bold text-[#1a2b4c] hover:text-rose-700">
                    <Activity size={16} /> Add Milestone
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={resetForm}
                  className="px-6 py-3 border rounded-xl text-slate-600 hover:bg-slate-50 font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="px-12 py-3 rounded-xl font-bold flex items-center gap-3 bg-[#1a2b4c] hover:bg-[#2a4272] text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {loading ? 'Saving...' : editingId ? 'Update Project' : 'Register Project'}
                </button>
              </div>
            </form>
          )
        )}

        {/* Projects list */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            All Projects
            {!fetching && <span className="text-sm font-normal text-slate-400 ml-2">({projects.length})</span>}
          </h2>
          {fetching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#1a2b4c]" size={36} />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No research projects yet. Add your first one above.
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
                  {project.thumbnail_url ? (
                    <img src={project.thumbnail_url} alt={project.title}
                      className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-14 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Microscope size={20} className="text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-700">
                        {project.department}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-700">
                        {project.status}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        project.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {project.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 truncate">{project.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Lead: {project.lead}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => togglePublish(project)}
                      title={project.published ? 'Unpublish' : 'Publish'}
                      className={`p-2 rounded-lg transition-colors ${
                        project.published ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50'
                      }`}>
                      {project.published ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => handleEdit(project)}
                      className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(project.id)}
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
    </div>
  )
}

export default ResearchAdmin