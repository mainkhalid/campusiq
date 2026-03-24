import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Microscope, User, Target,
  CheckCircle2, FileText, Briefcase, Calendar,
  Loader2, AlertCircle, DollarSign, Mail,
  ExternalLink, Tag
} from 'lucide-react'
import api from '../api/axios'

const DetailsPage = ({ type }) => {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    const endpoint = type === 'research'
      ? `/research/projects/${id}/`
      : `/scholarships/scholarships/${id}/`

    api.get(endpoint)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [id, type])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    try {
      return new Date(date).toLocaleDateString('en-KE', {
        month: 'long', day: 'numeric', year: 'numeric'
      })
    } catch { return date }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
      <p className="text-slate-600">Loading details...</p>
    </div>
  )

  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <AlertCircle className="text-red-500 mb-4" size={48} />
      <p className="text-slate-800 text-xl font-bold mb-2">Error Loading Data</p>
      <p className="text-slate-600 mb-6">{error}</p>
      <button onClick={() => navigate(-1)}
        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
        Go Back
      </button>
    </div>
  )

  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <AlertCircle className="text-slate-400 mb-4" size={48} />
      <p className="text-slate-800 text-xl font-bold mb-2">Item Not Found</p>
      <p className="text-slate-600 mb-6">The {type} you're looking for doesn't exist.</p>
      <button onClick={() => navigate(-1)}
        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
        Go Back
      </button>
    </div>
  )

  const isResearch = type === 'research'

  const hasRichData = isResearch
    ? (data.abstract && data.abstract.length > 80 && data.milestones?.length > 0)
    : true

  // If thin and has external source, redirect there
  if (isResearch && !hasRichData && data.external_link) {
    window.location.replace(data.external_link)
    return null
  }

  const getScholarshipStatus = () => {
    if (!data.published)          return { text: 'Draft',   color: 'bg-gray-500'    }
    if (!data.applications_open)  return { text: 'Closed',  color: 'bg-red-500'     }
    if (new Date(data.deadline) < new Date())
                                  return { text: 'Expired', color: 'bg-yellow-500'  }
    return                               { text: 'Active',  color: 'bg-green-500'   }
  }

  const scholarshipStatus = !isResearch ? getScholarshipStatus() : null
  const thumbnailSrc      = data.thumbnail_url || data.thumbnail?.url || null

  const title = isResearch ? data.title : data.name

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* Hero banner */}
      <div className="bg-[#1a2b4c] text-white pt-12 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors text-sm">
            <ArrowLeft size={18} /> Back
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {thumbnailSrc ? (
              <img
                src={thumbnailSrc}
                className="w-full md:w-72 aspect-video rounded-2xl object-cover shadow-2xl border-4 border-white/10 flex-shrink-0"
                alt={title}
              />
            ) : (
              <div className="w-full md:w-72 aspect-video rounded-2xl bg-white/5 border-4 border-white/10 flex items-center justify-center flex-shrink-0">
                <Microscope size={48} className="text-white/20" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <span className={`${scholarshipStatus?.color || 'bg-orange-500'} px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 inline-block`}>
                {isResearch ? (data.status || 'Active') : scholarshipStatus.text}
              </span>

              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">{title}</h1>

              <div className="flex flex-wrap gap-5 text-slate-300 text-sm">
                <div className="flex items-center gap-2">
                  {isResearch ? <User size={16}/> : <Briefcase size={16}/>}
                  <span>
                    {isResearch
                      ? `Lead: ${data.lead || 'N/A'}`
                      : `Provider: ${data.provider || 'N/A'}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16}/>
                  <span>
                    {isResearch
                      ? `Added: ${formatDate(data.created_at)}`
                      : `Deadline: ${formatDate(data.deadline)}`}
                  </span>
                </div>
                {!isResearch && data.amount && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={16}/>
                    <span className="font-bold">{data.amount}</span>
                  </div>
                )}
                {isResearch && data.department && (
                  <div className="flex items-center gap-2">
                    <Microscope size={16}/>
                    <span>{data.department}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {data.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-4">
                  {data.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-white/10 text-slate-300 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 -mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Abstract / Description */}
            {(isResearch ? data.abstract : data.description) && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="text-orange-500" size={20} />
                  {isResearch ? 'Abstract' : 'Description'}
                </h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                  {isResearch ? data.abstract : data.description}
                </p>
              </div>
            )}

            {/* Research: thin project notice */}
            {isResearch && !hasRichData && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 text-sm mb-1">Limited information available</p>
                  <p className="text-amber-700 text-xs">
                    This project was imported from the research directorate website.
                    Full details including methodology, milestones and funding are available at the source.
                  </p>
                  {data.external_link && (
                    <a href={data.external_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-amber-800 hover:text-amber-900">
                      View source <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Research: Milestones */}
            {isResearch && data.milestones?.length > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <Target className="text-orange-500" size={20} /> Project Milestones
                </h2>
                <div className="space-y-3">
                  {data.milestones.map((m, i) => (
                    <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${
                      m.completed ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <CheckCircle2 size={18} className={m.completed ? 'text-green-500' : 'text-slate-300'} />
                      <span className={`text-sm font-medium ${m.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                        {m.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scholarship: Requirements */}
            {!isResearch && data.requirements?.length > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <CheckCircle2 className="text-orange-500" size={20} /> Requirements
                </h2>
                <ul className="space-y-3">
                  {data.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm">
                      <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 size={12} />
                      </div>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scholarship: Tags */}
            {!isResearch && data.tags?.length > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Tag size={18} className="text-orange-500" /> Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag, i) => (
                    <span key={i} className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Research: Funding */}
            {isResearch && data.funding && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-3 text-sm">Funding</h4>
                <p className="text-slate-600 text-sm">{data.funding}</p>
              </div>
            )}

            {/* Research: Collaborators */}
            {isResearch && data.collaborators?.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-3 text-sm">Collaborators</h4>
                <div className="space-y-2">
                  {data.collaborators.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1a2b4c]/10 flex items-center justify-center text-xs font-black text-[#1a2b4c]">
                        {c.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-600">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Research: Source link */}
            {isResearch && data.external_link && (
              <a
                href={data.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 hover:border-[#1a2b4c] text-[#1a2b4c] rounded-2xl font-bold text-sm transition-all"
              >
                <ExternalLink size={15} /> View on Research Site
              </a>
            )}

            {/* Scholarship: Eligibility */}
            {!isResearch && data.eligibility && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-3 text-sm">Eligibility</h4>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-blue-700 font-bold text-sm">
                  <Target size={16} /> {data.eligibility}
                </div>
              </div>
            )}

            {/* Scholarship: Contact */}
            {!isResearch && data.contact_email && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                  <Mail size={15} /> Contact
                </h4>
                <a href={`mailto:${data.contact_email}`}
                  className="text-sm text-blue-600 hover:text-blue-700 underline break-all">
                  {data.contact_email}
                </a>
              </div>
            )}

            {/* Apply / Contact button */}
            {!isResearch && data.application_url ? (
              <a href={data.application_url} target="_blank" rel="noopener noreferrer"
                className="block w-full py-4 bg-rose-500 hover:bg-rose-600 text-white text-center rounded-2xl font-bold shadow-lg shadow-rose-200 transition-all">
                Apply Now
              </a>
            ) : (
              <button className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all">
                {isResearch ? 'Contact Lead Researcher' : 'Apply for Scholarship'}
              </button>
            )}

            {/* Scholarship: Status summary */}
            {!isResearch && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 text-sm">Application Status</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Published</span>
                    <span className={`font-bold ${data.published ? 'text-green-600' : 'text-red-600'}`}>
                      {data.published ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applications</span>
                    <span className={`font-bold ${data.applications_open ? 'text-green-600' : 'text-red-600'}`}>
                      {data.applications_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {data.published_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Published</span>
                      <span className="font-medium text-slate-800">{formatDate(data.published_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetailsPage