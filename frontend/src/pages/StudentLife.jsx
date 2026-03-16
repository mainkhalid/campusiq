// ─────────────────────────────────────────────────────────────────────────────
// StudentLife.jsx — SectionBlock updated to use GET /content/student-life/
//
// Previously: each of the 4 SectionBlock components mounted and fired
//             POST /aibot/chat/ independently → 4 LLM calls per page visit.
//
// Now:        a single useStudentLifeContent() hook fetches all 4 sections
//             in one GET request from the server-side cache → 0 LLM calls.
//             The hook is called at the StudentLife page level and the result
//             is passed down as props — so only one request fires total.
//
// The StudentLifeAsk section at the bottom is UNCHANGED — it's a genuine
// interactive question box and should continue using /aibot/chat/.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Heart, Users, Trophy, BookOpen,
  Briefcase, Loader2, RefreshCw, ArrowRight,
  Sparkles, ExternalLink
} from 'lucide-react'
import api from '../api/axios'
import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    id:       'clubs',
    label:    'Student Clubs',
    icon:     Users,
    color:    'bg-blue-500',
    light:    'bg-blue-50 border-blue-100 text-blue-700',
    fallback: [
      { name: 'Tech Innovators Club',   desc: 'Coding, hardware and weekly hackathons.',            badge: '120+ members' },
      { name: 'Drama & Arts Society',   desc: 'Theatre, dance and spoken word performances.',        badge: '80+ members'  },
      { name: 'Environmental Club',     desc: 'Sustainability initiatives and campus greening.',     badge: '50+ members'  },
      { name: 'Entrepreneurship Hub',   desc: 'Nurturing business leaders and student startups.',   badge: '200+ members' },
      { name: 'Debate Club',            desc: 'Public speaking, critical thinking and competitions.',badge: 'Open'         },
    ],
  },
  {
    id:       'sports',
    label:    'Sports & Athletics',
    icon:     Trophy,
    color:    'bg-orange-500',
    light:    'bg-orange-50 border-orange-100 text-orange-700',
    fallback: [
      { name: 'Zetech Sparks – Basketball', desc: 'Premier league team competing nationally.',     badge: '3× Champions'       },
      { name: 'Football Club',              desc: "Men's and women's teams in university league.", badge: 'Regional Finalists'  },
      { name: 'Rugby 7s',                   desc: 'High-intensity training and major tournaments.',badge: 'Top 10 National'     },
      { name: 'Volleyball',                 desc: 'Competitive indoor volleyball across campuses.',badge: 'Active'              },
    ],
  },
  {
    id:       'facilities',
    label:    'Campus Facilities',
    icon:     BookOpen,
    color:    'bg-emerald-500',
    light:    'bg-emerald-50 border-emerald-100 text-emerald-700',
    fallback: [
      { name: 'Library & e-Resources', desc: 'Physical and digital collections via myLOFT portal.', badge: '24/7 Access'   },
      { name: 'Cafeteria & Canteen',   desc: 'Affordable meals and snacks across all campuses.',     badge: 'All Campuses' },
      { name: 'Fitness Center',        desc: 'Fully equipped gym with certified trainers.',          badge: 'Ruiru Campus' },
      { name: 'Student Hostels',       desc: 'On-campus accommodation with Wi-Fi and security.',    badge: 'Apply Online' },
      { name: 'Shuttle Transport',     desc: 'Bus services covering major routes around campus.',    badge: 'Daily Routes' },
    ],
  },
  {
    id:       'career',
    label:    'Career & Welfare',
    icon:     Briefcase,
    color:    'bg-purple-500',
    light:    'bg-purple-50 border-purple-100 text-purple-700',
    fallback: [
      { name: 'Career Centre',        desc: 'CV clinics, job boards and employer linkages.',       badge: 'Free Service'   },
      { name: 'Internship Placement', desc: 'Industry attachment support for all programmes.',     badge: 'Mandatory'      },
      { name: 'Counselling Services', desc: '24/7 mental health support and peer mentorship.',     badge: 'Confidential'   },
      { name: 'Alumni Network',       desc: 'Stay connected and access the alumni community.',     badge: '10,000+ alumni' },
    ],
  },
]

// ── Single hook — fetches all 4 sections in ONE request ──────────────────────
function useStudentLifeContent() {
  const [content, setContent]   = useState(null)   // { clubs, sports, facilities, career }
  const [loading, setLoading]   = useState(true)
  const [source, setSource]     = useState(null)
  const fetched = useRef(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/aiconfig/content/student-life/')
      setContent(res.data?.data || null)
      setSource(res.data?.source || null)
    } catch {
      setContent(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!fetched.current) { fetched.current = true; load() }
  }, [])

  return { content, loading, source, reload: load }
}

// ── Section card — receives items as prop, no internal fetch ─────────────────
function SectionBlock({ section, items, loading, isLive, onReload }) {
  const Icon      = section.icon
  const displayed = (items && items.length >= 2) ? items : section.fallback

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${section.color} rounded-xl flex items-center justify-center`}>
            <Icon size={16} className="text-white" />
          </div>
          <h3 className="font-black text-[#1a2b4c] text-base">{section.label}</h3>
          {!loading && isLive && items && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              <Sparkles size={9} /> Live
            </span>
          )}
        </div>
        {/* Reload only makes sense on the page level — button wired to parent reload */}
        <button onClick={onReload} disabled={loading}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((item, i) => (
              <div key={i}
                className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-sm ${section.light}`}>
                <div className="min-w-0">
                  <p className="font-bold text-[#1a2b4c] text-sm">{item.name}</p>
                  {item.desc && (
                    <p className="text-slate-500 text-xs leading-relaxed mt-0.5 line-clamp-2">{item.desc}</p>
                  )}
                </div>
                {item.badge && (
                  <span className="text-[10px] font-black bg-white/80 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 text-slate-600 shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── StudentLifeAsk — UNCHANGED, uses /aibot/chat/ correctly ──────────────────
function StudentLifeAsk() {
  const [q, setQ]           = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const CHIPS = [
    'How do I join a club?',
    'Is there hostel accommodation?',
    'What transport routes are available?',
    'How does the career centre work?',
  ]

  const ask = async (msg) => {
    const question = msg || q
    if (!question.trim()) return
    setLoading(true)
    setAnswer('')
    setQ(question)
    try {
      const res = await api.post('/aibot/chat/', {
        message: question,
        active_topic: 'general',
      })
      setAnswer(res.data?.data?.response || 'No information found. Try asking the main chat assistant.')
    } catch {
      setAnswer('Connection error. Please try the chat widget instead.')
    } finally {
      setLoading(false)
    }
  }

  const format = (text) =>
    text.split('\n').map((line, i) => {
      const bullet  = /^[-*•]\s+/.test(line)
      const content = bullet ? line.replace(/^[-*•]\s+/, '') : line
      const parts   = content.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
        /^\*\*[^*]+\*\*$/.test(p) ? <strong key={j}>{p.slice(2,-2)}</strong> : p
      )
      if (bullet) return <div key={i} className="flex gap-2 my-0.5"><span className="text-orange-400 flex-shrink-0">•</span><span>{parts}</span></div>
      if (!content.trim()) return <div key={i} className="h-1.5" />
      return <div key={i}>{parts}</div>
    })

  return (
    <section className="py-16 bg-[#1a2b4c]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">Campus Knowledge</p>
          <h2 className="text-3xl font-black text-white">Ask about student life</h2>
          <p className="text-slate-400 text-sm mt-2">I'll search our campus knowledge base for the answer</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {CHIPS.map(c => (
            <button key={c} onClick={() => ask(c)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/40 text-slate-300 text-xs rounded-full transition-all">
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="e.g. What facilities are available at Ruiru campus?"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-orange-500/50 transition-all" />
          <button onClick={() => ask()} disabled={loading || !q.trim()}
            className="px-5 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all flex-shrink-0">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
          </button>
        </div>

        {(loading || answer) && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            {loading
              ? <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin text-orange-400" /> Searching...</div>
              : <div className="text-slate-200 text-sm leading-relaxed">{format(answer)}</div>
            }
          </div>
        )}
      </div>
    </section>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentLife() {
  const { content, loading, source, reload } = useStudentLifeContent()

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="bg-[#1a2b4c] text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">Campus Life</p>
          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4 max-w-2xl">Life at Zetech</h1>
          <p className="text-slate-300 text-lg max-w-xl leading-relaxed">
            Beyond the classroom — clubs, sports, wellness, facilities and a community that supports you.
          </p>
        </div>
      </div>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Powered by campus knowledge</p>
              <h2 className="text-3xl font-black text-[#1a2b4c]">Explore Student Life</h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-full">
              <Sparkles size={11} className="text-orange-400" />
              {source === 'cache' ? 'Cached content' : 'AI-sourced content'}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {SECTIONS.map(section => (
              <SectionBlock
                key={section.id}
                section={section}
                items={content?.[section.id]?.items || null}
                loading={loading}
                isLive={!!content && !loading}
                onReload={reload}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-4 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-[#1a2b4c] rounded-3xl p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <Heart className="text-orange-400 mb-4" size={32} />
              <h3 className="text-2xl font-black text-white mb-3">Wellness & Support</h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                Your wellbeing matters. Access confidential counselling, peer mentorship, medical services,
                and 24/7 support — all on campus, all free for enrolled students.
              </p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <a href="https://wa.me/254746071362" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all">
                Get Support <ExternalLink size={14} />
              </a>
              <Link to="/admissions"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all text-center justify-center">
                Apply Now <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <StudentLifeAsk />

      <section className="py-20 text-center bg-white">
        <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Join Us</p>
        <h2 className="text-4xl font-black text-[#1a2b4c] mb-3">Ready to be part of it?</h2>
        <p className="text-slate-500 mb-8 text-sm">Applications for the next intake are open now.</p>
        <a href="https://sajili.zetech.ac.ke" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#1a2b4c] hover:bg-[#243660] text-white px-10 py-4 rounded-xl font-black text-sm transition-all shadow-lg hover:-translate-y-0.5">
          Apply for Admission <ArrowRight size={16} />
        </a>
      </section>
    </div>
  )
}