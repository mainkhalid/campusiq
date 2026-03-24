import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, ExternalLink, Calendar, Tag } from 'lucide-react'
import api from '../api/axios'
import ScholarshipCard from '../components/ScholarshipCard'

// ── Research news card ────────────────────────────────────────────────────────
function ResearchNewsCard({ article }) {
  const thumbnailUrl = article.thumbnail_url
    || (article.thumbnail && article.thumbnail.url)
    || null

  const date = article.event_date
    ? new Date(article.event_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date(article.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

  const handleClick = () => {
    if (article.external_link) window.open(article.external_link, '_blank')
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all group ${article.external_link ? 'cursor-pointer' : ''}`}
    >
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2b4c] to-[#2a457a]">
            <span className="text-white/20 text-6xl font-black">R</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-black px-2 py-1 rounded-full uppercase bg-orange-500 text-white">
            Research
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
          <Calendar size={11} />
          {date}
        </div>
        <h3 className="font-black text-[#1a2b4c] text-sm leading-snug mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {article.title}
        </h3>
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
          {article.content}
        </p>
        {article.tags?.length > 0 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {article.tags.slice(0, 2).map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">{t}</span>
            ))}
          </div>
        )}
        {article.external_link && (
          <div className="flex items-center gap-1 mt-3 text-orange-500 text-xs font-bold group-hover:text-orange-600">
            Read more <ExternalLink size={11} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Project card — text only, no image ───────────────────────────────────────
function ProjectCard({ project, onDetails }) {
  const hasRichData = project.abstract && project.abstract.length > 50

  const handleDetails = () => {
    if (hasRichData) {
      onDetails(project.id)
    } else if (project.external_link || project.source_url) {
      window.open(project.external_link || project.source_url, '_blank')
    } else {
      onDetails(project.id)
    }
  }

  // Accent colour per department
  const accent = {
    Tech:     { bg: 'bg-blue-50',   border: 'border-blue-100',   dot: 'bg-blue-500'   },
    Health:   { bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' },
    Arts:     { bg: 'bg-purple-50', border: 'border-purple-100', dot: 'bg-purple-500' },
    Sciences: { bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-500' },
  }[project.department] || { bg: 'bg-slate-50', border: 'border-slate-100', dot: 'bg-slate-400' }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
      {/* Coloured top strip */}
      <div className={`h-1.5 rounded-t-2xl ${accent.dot}`} />

      <div className="p-6 flex flex-col flex-1">
        {/* Dept + status row */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${accent.bg} ${accent.border} border`}
            style={{ color: 'inherit' }}>
            {project.department}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 uppercase">
            {project.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[#1a2b4c] font-black text-base leading-snug mb-2 line-clamp-2">
          {project.title}
        </h3>

        {/* Abstract */}
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 flex-1">
          {project.abstract || 'No abstract available.'}
        </p>

        {/* Tags */}
        {project.tags?.length > 0 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {project.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">{t}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${accent.bg}`}>
              {project.lead?.charAt(0) || 'R'}
            </div>
            <span className="text-xs text-slate-500 truncate">{project.lead}</span>
          </div>
          <button
            onClick={handleDetails}
            className="text-[#1a2b4c] font-bold text-sm hover:text-orange-600 flex-shrink-0 transition-colors"
          >
            {hasRichData ? 'Details' : 'View'} →
          </button>
        </div>
      </div>
    </div>
  )
}

const Research = () => {
  const navigate = useNavigate()
  const [projects, setProjects]           = useState([])
  const [scholarships, setScholarships]   = useState([])
  const [researchNews, setResearchNews]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [scholarshipsLoading, setScholarshipsLoading] = useState(true)
  const [newsLoading, setNewsLoading]     = useState(true)

  // Research projects
  useEffect(() => {
    api.get('/research/projects/?published=true')
      .then(res => setProjects(res.data.results ?? res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  
  useEffect(() => {
    api.get('/news/posts/?status=published&ordering=-created_at&category=news')
      .then(res => {
        const all = res.data.results ?? res.data.data ?? res.data ?? []
        const research = all.filter(a =>
          Array.isArray(a.tags) && a.tags.some(t =>
            ['research', 'innovation', 'grants', 'technology', 'health research', 'conferences'].includes(t.toLowerCase())
          )
        )
        setResearchNews(research.slice(0, 6))
      })
      .catch(console.error)
      .finally(() => setNewsLoading(false))
  }, [])

  // Scholarships
  useEffect(() => {
    api.get('/scholarships/scholarships/active/')
      .then(res => setScholarships(res.data.data ?? []))
      .catch(() =>
        api.get('/scholarships/scholarships/?published=true')
          .then(res => setScholarships(res.data.results ?? []))
          .catch(console.error)
      )
      .finally(() => setScholarshipsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <section
        className="relative py-20 text-white bg-cover bg-center"
        style={{ backgroundImage: "url('https://cdn.tuko.co.ke/images/720/18d0a87c71bce9fb.webp?v=1')" }}
      >
        <div className="absolute inset-0 bg-[#1a2b4c]/85" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <p className="text-orange-400 text-xs font-black uppercase tracking-widest mb-3">Zetech University</p>
          <h1 className="text-5xl font-extrabold mb-4">Research & Innovation</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            "Advancing knowledge through technology and community-centered research."
          </p>
        </div>
      </section>

      
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
            <div>
              <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Ongoing Work</p>
              <h2 className="text-4xl font-extrabold text-[#1a2b4c]">Research Projects</h2>
            </div>
            <button
              onClick={() => navigate('/research-projects')}
              className="text-orange-600 font-bold flex items-center gap-2 hover:gap-3 transition-all text-sm"
            >
              View all projects <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-orange-500" size={36} />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              No active research projects at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.slice(0, 3).map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDetails={id => navigate(`/research/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Research News*/}
      {(newsLoading || researchNews.length > 0) && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
              <div>
                <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2">From the Directorate</p>
                <h2 className="text-4xl font-extrabold text-[#1a2b4c]">Research News</h2>
              </div>
              <button
                onClick={() => navigate('/news')}
                className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all text-sm"
              >
                All news <ArrowRight size={16} />
              </button>
            </div>

            {newsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-blue-400" size={32} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {researchNews.map(article => (
                  <ResearchNewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Scholarships */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-2">Funding Opportunities</p>
            <h2 className="text-4xl font-extrabold text-[#1a2b4c] mb-4">Scholarships & Grants</h2>
          </div>

          {scholarshipsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-rose-500" size={36} />
            </div>
          ) : scholarships.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              No active scholarships available at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {scholarships.slice(0, 3).map(scholarship => (
                <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
              ))}
            </div>
          )}

          {scholarships.length > 3 && (
            <div className="text-center mt-10">
              <button
                onClick={() => navigate('/scholarships')}
                className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all inline-flex items-center gap-2"
              >
                View all scholarships <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Research