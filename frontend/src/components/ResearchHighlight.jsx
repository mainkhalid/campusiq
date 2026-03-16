import React, { useEffect, useState, useRef } from 'react'
import { ArrowUpRight, RefreshCw, FlaskConical } from 'lucide-react'
import api from '../api/axios'
import { Link } from 'react-router-dom'

const FALLBACK = [
  { title: 'Technology & Innovation',     desc: 'Applied research in software engineering, AI systems and digital transformation for East African industries.', department: 'Tech',     status: 'Active'    },
  { title: 'Business & Entrepreneurship', desc: 'Studies in SME growth, fintech adoption and youth entrepreneurship across Kenya and the region.',              department: 'Sciences', status: 'Active'    },
  { title: 'Health Sciences Research',    desc: 'Community health studies, nursing practice improvements and public health interventions.',                     department: 'Health',   status: 'Active'    },
  { title: 'Education & Pedagogy',        desc: 'Research into blended learning, TVET effectiveness and curriculum development at tertiary level.',             department: 'Arts',     status: 'Planning'  },
]

// Department → colour scheme
const DEPT_STYLE = {
  Tech:     { pill: 'bg-blue-50 text-blue-700 border-blue-100',     dot: 'bg-blue-500'     },
  Health:   { pill: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  Arts:     { pill: 'bg-purple-50 text-purple-700 border-purple-100',   dot: 'bg-purple-500'   },
  Sciences: { pill: 'bg-orange-50 text-orange-700 border-orange-100',   dot: 'bg-orange-500'   },
}
const DEFAULT_STYLE = { pill: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' }

// Status → badge colour
const STATUS_STYLE = {
  'Active':      'bg-green-50 text-green-700 border-green-100',
  'Completed':   'bg-slate-100 text-slate-500 border-slate-200',
  'Peer Review': 'bg-amber-50 text-amber-700 border-amber-100',
  'Planning':    'bg-sky-50 text-sky-700 border-sky-100',
}

function useResearchContent() {
  const [pillars, setPillars] = useState(null)
  const [loading, setLoading] = useState(true)
  const [source, setSource]   = useState(null)
  const fetched = useRef(false)

  const load = async () => {
    setLoading(true)
    try {
      const res  = await api.get('/aiconfig/content/research/')
      const data = res.data?.data?.pillars
      setPillars(Array.isArray(data) && data.length >= 2 ? data : null)
      setSource(res.data?.source || null)
    } catch {
      setPillars(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!fetched.current) { fetched.current = true; load() }
  }, [])

  return { pillars, loading, source, reload: load }
}

export default function ResearchHighlight() {
  const { pillars, loading, source, reload } = useResearchContent()
  const displayed = pillars || FALLBACK

  return (
    <div className="bg-[#F8FAFC] border-y border-slate-200 py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#1a2b4c 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-12 gap-16 items-start">

        {/* Left */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-orange-100 shadow-sm rounded-full mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Research</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[#1a2b4c] leading-[1.1] mb-5 tracking-tight">
              Research &<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                Innovation
              </span>
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Zetech University drives applied research that addresses real challenges in technology,
              health, business and education across Kenya and East Africa.
            </p>
          </div>

          <Link to="/research"
            className="inline-flex items-center gap-3 bg-[#1a2b4c] text-white px-7 py-4 rounded-full font-bold hover:bg-orange-600 transition-all group shadow-lg shadow-[#1a2b4c]/10 text-sm">
            Explore Research & Scholarships
            <ArrowUpRight size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Right — project cards */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">

            {/* Panel header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                  <FlaskConical size={16} className="text-orange-500" />
                </div>
                <div>
                  <p className="font-black text-[#1a2b4c] text-sm">Research Projects</p>
                  <p className="text-[10px] text-slate-400">
                    {source === 'cache' ? 'From research database · cached' : 'From research database'}
                  </p>
                </div>
              </div>
              <button onClick={reload} disabled={loading}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-40">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Project rows */}
            <div className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3,4].map(i => (
                  <div key={i} className="p-5 flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-slate-100 mt-2 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-slate-100 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-slate-50 rounded animate-pulse w-full" />
                      <div className="h-3 bg-slate-50 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                displayed.map((p, i) => {
                  const dept   = DEPT_STYLE[p.department]   || DEFAULT_STYLE
                  const status = STATUS_STYLE[p.status]      || STATUS_STYLE['Planning']
                  return (
                    <div key={i}
                      className="flex gap-4 items-start px-6 py-5 hover:bg-slate-50/60 transition-colors group">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${dept.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {p.department && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${dept.pill}`}>
                              {p.department}
                            </span>
                          )}
                          {p.status && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${status}`}>
                              {p.status}
                            </span>
                          )}
                        </div>
                        <p className="font-black text-[#1a2b4c] text-sm leading-snug mb-1">
                          {p.title}
                        </p>
                        {p.desc && (
                          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                            {p.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer CTA */}
            <div className="mx-6 mb-6 mt-2 p-5 bg-gradient-to-br from-[#1a2b4c] to-[#2a457a] rounded-2xl text-white">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Commitment</p>
              <p className="text-sm leading-relaxed text-slate-200 italic">
                "Our research bridges academic knowledge and practical impact — preparing graduates who don't just understand the world, but change it."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}