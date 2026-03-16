import React, { useEffect, useState } from 'react'
import {
  CheckCircle, Clock, Calendar, Download, ChevronRight,
  Phone, Mail, MessageCircle, Users, Globe, Award, DollarSign,
  FileText, Loader2, ArrowRight, Sparkles
} from 'lucide-react'
import ApplicationSteps from '../components/ApplicationSteps'
import api from '../api/axios'

// ── Fallbacks ────────────────────────────────────────────────
const FALLBACK_CONTACT = {
  phone_primary:    '+254 709 912 000',
  phone_secondary:  '+254 746 071 362',
  email_admissions: 'admissions@zetech.ac.ke',
  whatsapp:         '254746071362',
}

const REQUIREMENTS = [
  {
    level: 'Undergraduate',
    icon:  FileText,
    color: 'bg-blue-50 border-blue-100',
    accent: 'text-blue-600 bg-blue-100',
    items: [
      'KCSE Certificate — minimum C+ (Plus)',
      'Relevant subject clusters for specific programmes',
      'International equivalents accepted (IGCSE, IB, A-Levels)',
      'Mature entry available for applicants 25+ years',
    ],
  },
  {
    level: 'Postgraduate',
    icon:  Award,
    color: 'bg-purple-50 border-purple-100',
    accent: 'text-purple-600 bg-purple-100',
    items: [
      "Bachelor's degree from a recognised institution",
      'Minimum Second Class (Lower Division) or equivalent',
      'Relevant work experience may be required',
      'Research proposal required for PhD programmes',
    ],
  },
  {
    level: 'Diploma',
    icon:  FileText,
    color: 'bg-emerald-50 border-emerald-100',
    accent: 'text-emerald-600 bg-emerald-100',
    items: [
      'KCSE Certificate — minimum D+ (Plus)',
      'Relevant certificate for diploma progression',
      'O-Level or equivalent qualifications',
      'Mature entry options available',
    ],
  },
]

const INTAKES = [
  { month: 'January', deadline: 'January 15', starts: 'Early January',    status: 'open'   },
  { month: 'May',     deadline: 'April 15',   starts: 'Early May',        status: 'soon'   },
  { month: 'September', deadline: 'August 15',starts: 'Early September',  status: 'soon'   },
]

const BENEFITS = [
  { icon: Users,      title: 'Experienced Faculty',    desc: 'Learn from industry experts and academic professionals' },
  { icon: Globe,      title: 'Global Recognition',     desc: 'Internationally accredited programmes and qualifications' },
  { icon: DollarSign, title: 'Flexible Payment',       desc: 'Affordable fees with HELB and instalment options' },
  { icon: Award,      title: 'Scholarships Available', desc: 'Merit and need-based financial aid opportunities' },
]

// ── Chunk-powered AI FAQ ─────────────────────────────────────
const SUGGESTED = [
  'What documents do I need to apply?',
  'How much are the application fees?',
  'Can I pay fees in instalments?',
  'Is HELB accepted at Zetech?',
  'How long does admission take?',
]

function AdmissionsFAQ() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [asked, setAsked]       = useState(false)

  const ask = async (q) => {
    const msg = q || question
    if (!msg.trim()) return
    setLoading(true)
    setAsked(true)
    setAnswer('')
    setQuestion(msg)
    try {
      const res = await api.post('/aibot/chat/', {
        message: msg,
        history: [],
        active_topic: 'admissions',
      })
      setAnswer(res.data?.data?.response || 'Sorry, I could not find an answer. Please contact admissions directly.')
    } catch {
      setAnswer('Connection error. Please contact admissions@zetech.ac.ke for assistance.')
    } finally {
      setLoading(false)
    }
  }

  const formatAnswer = (text) =>
    text.split('\n').map((line, i) => {
      const isBullet = /^[-*•]\s+/.test(line)
      const content  = isBullet ? line.replace(/^[-*•]\s+/, '') : line
      const parts    = content.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
        /^\*\*[^*]+\*\*$/.test(p) ? <strong key={j}>{p.slice(2,-2)}</strong> : p
      )
      if (isBullet) return <div key={i} className="flex gap-2 my-1"><span className="text-orange-500 mt-0.5 flex-shrink-0">•</span><span>{parts}</span></div>
      if (!content.trim()) return <div key={i} className="h-2" />
      return <div key={i}>{parts}</div>
    })

  return (
    <section className="py-20 bg-[#1a2b4c]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
            <Sparkles size={12} /> AI-Powered
          </div>
          <h2 className="text-4xl font-black text-white mb-3">Have a question?</h2>
          <p className="text-slate-400 text-sm">
            Ask anything about admissions — I'll search our knowledge base for the answer
          </p>
        </div>

        {/* Suggested questions */}
        {!asked && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {SUGGESTED.map(q => (
              <button key={q} onClick={() => ask(q)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/40 text-slate-300 text-sm rounded-full transition-all">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3 mb-6">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="e.g. What are the January intake deadlines?"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all"
          />
          <button onClick={() => ask()}
            disabled={loading || !question.trim()}
            className="px-6 py-3.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all flex-shrink-0">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            Ask
          </button>
        </div>

        {/* Answer */}
        {(loading || answer) && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            {loading ? (
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin text-orange-400" />
                Searching knowledge base...
              </div>
            ) : (
              <>
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-3">Answer</p>
                <div className="text-slate-200 text-sm leading-relaxed space-y-0.5">
                  {formatAnswer(answer)}
                </div>
                <button onClick={() => { setAsked(false); setAnswer(''); setQuestion('') }}
                  className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  ← Ask another question
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Scholarships strip ───────────────────────────────────────
function ScholarshipsStrip() {
  const [scholarships, setScholarships] = useState([])

  useEffect(() => {
    api.get('/scholarships/?limit=3')
      .then(res => {
        const list = res.data?.results ?? res.data?.data ?? res.data ?? []
        setScholarships(Array.isArray(list) ? list.slice(0, 3) : [])
      })
      .catch(() => {})
  }, [])

  if (scholarships.length === 0) return null

  return (
    <div className="bg-orange-50 border-y border-orange-100 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Financial Aid</p>
            <h3 className="text-xl font-black text-[#1a2b4c]">Available Scholarships</h3>
          </div>
          <a href="/research" className="text-sm font-bold text-orange-600 flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={14} />
          </a>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {scholarships.map((s, i) => (
            <div key={s.id || i} className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
              <p className="font-black text-[#1a2b4c] text-sm mb-1 line-clamp-1">{s.title || s.name}</p>
              <p className="text-slate-500 text-xs line-clamp-2">{s.description || s.summary}</p>
              {(s.deadline || s.amount) && (
                <p className="text-orange-500 text-xs font-bold mt-2">
                  {s.amount && `${s.amount} · `}{s.deadline && `Deadline: ${s.deadline}`}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function Admissions() {
  const [contact, setContact] = useState(FALLBACK_CONTACT)

  useEffect(() => {
    api.get('/university/settings/')
      .then(res => {
        const d = res.data?.data ?? res.data
        if (d?.contact) setContact(prev => ({ ...prev, ...d.contact }))
      })
      .catch(() => {})
  }, [])

  const whatsappLink = `https://wa.me/${(contact.whatsapp || FALLBACK_CONTACT.whatsapp).replace(/\D/g,'')
    }?text=${encodeURIComponent("Hello! I'd like to know more about admissions at Zetech University.")}`

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────── */}
      <div className="bg-[#1a2b4c] text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">Admissions</p>
          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-5 max-w-2xl">
            Begin your<br />journey here
          </h1>
          <p className="text-slate-300 text-lg max-w-xl leading-relaxed mb-10">
            Three intakes a year, flexible payment options, and a team ready to help you every step of the way.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="https://sajili.zetech.ac.ke" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-7 py-4 rounded-xl font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5">
              Apply Online <ChevronRight size={16} />
            </a>
            <a href="https://www.zetech.ac.ke/index.php/downloads?download=59:students-handbook"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-7 py-4 rounded-xl font-bold text-sm transition-all">
              <Download size={16} /> Download Prospectus
            </a>
          </div>
        </div>
      </div>

      {/* ── Benefits bar ──────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 text-center hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon size={22} className="text-orange-500" />
              </div>
              <h3 className="font-black text-[#1a2b4c] text-sm mb-1">{title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Entry Requirements ────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Requirements</p>
            <h2 className="text-4xl font-black text-[#1a2b4c]">Entry Requirements</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {REQUIREMENTS.map(({ level, icon: Icon, color, accent, items }) => (
              <div key={level} className={`rounded-2xl border p-8 ${color}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${accent}`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-black text-[#1a2b4c] mb-5">{level}</h3>
                <ul className="space-y-3">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scholarships from DB ──────────────────────── */}
      <ScholarshipsStrip />

      {/* ── Application Steps ─────────────────────────── */}
      <ApplicationSteps />

      {/* ── Intake Schedule ───────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Intake Calendar</p>
            <h2 className="text-4xl font-black text-[#1a2b4c]">Upcoming Intakes</h2>
            <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto">
              Three intakes per year — January, May and September
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {INTAKES.map(({ month, deadline, starts, status }) => (
              <div key={month}
                className={`rounded-2xl p-8 border-2 transition-all ${
                  status === 'open'
                    ? 'bg-[#1a2b4c] border-[#1a2b4c] text-white shadow-xl shadow-[#1a2b4c]/20'
                    : 'bg-white border-slate-200 hover:border-orange-300'
                }`}>
                <div className="flex items-center justify-between mb-5">
                  <Calendar size={22} className={status === 'open' ? 'text-orange-400' : 'text-orange-500'} />
                  <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase ${
                    status === 'open'
                      ? 'bg-green-400/20 text-green-400'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {status === 'open' ? 'Now Open' : 'Coming Soon'}
                  </span>
                </div>
                <h3 className={`text-2xl font-black mb-4 ${status === 'open' ? 'text-white' : 'text-[#1a2b4c]'}`}>
                  {month}
                </h3>
                <div className={`space-y-2 text-sm ${status === 'open' ? 'text-slate-300' : 'text-slate-600'}`}>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="flex-shrink-0" />
                    <span>Deadline: <strong>{deadline}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="flex-shrink-0" />
                    <span>Starts: <strong>{starts}</strong></span>
                  </div>
                </div>
                {status === 'open' && (
                  <a href="https://sajili.zetech.ac.ke" target="_blank" rel="noopener noreferrer"
                    className="mt-6 flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all justify-center">
                    Apply Now <ArrowRight size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI FAQ ────────────────────────────────────── */}
      <AdmissionsFAQ />

      {/* ── Contact & CTA ─────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Get In Touch</p>
          <h2 className="text-4xl font-black text-[#1a2b4c] mb-3">Ready to apply?</h2>
          <p className="text-slate-500 mb-10 text-sm max-w-md mx-auto">
            Our admissions team is available Monday–Friday, 8am–5pm EAT
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <a href={`tel:${contact.phone_primary || FALLBACK_CONTACT.phone_primary}`}
              className="flex items-center gap-3 bg-slate-50 border border-slate-200 hover:border-[#1a2b4c] px-6 py-3.5 rounded-xl transition-all group">
              <Phone size={18} className="text-[#1a2b4c]" />
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Call Us</p>
                <p className="text-sm font-black text-[#1a2b4c]">{contact.phone_primary || FALLBACK_CONTACT.phone_primary}</p>
              </div>
            </a>
            <a href={`mailto:${contact.email_admissions || FALLBACK_CONTACT.email_admissions}`}
              className="flex items-center gap-3 bg-slate-50 border border-slate-200 hover:border-[#1a2b4c] px-6 py-3.5 rounded-xl transition-all">
              <Mail size={18} className="text-[#1a2b4c]" />
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                <p className="text-sm font-black text-[#1a2b4c]">{contact.email_admissions || FALLBACK_CONTACT.email_admissions}</p>
              </div>
            </a>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-50 border border-green-200 hover:border-green-500 px-6 py-3.5 rounded-xl transition-all">
              <MessageCircle size={18} className="text-green-600" />
              <div className="text-left">
                <p className="text-[10px] text-green-600 font-bold uppercase">WhatsApp</p>
                <p className="text-sm font-black text-green-700">Chat with us</p>
              </div>
            </a>
          </div>
          <a href="https://sajili.zetech.ac.ke" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1a2b4c] hover:bg-[#243660] text-white px-10 py-4 rounded-xl font-black text-sm transition-all shadow-lg hover:-translate-y-0.5">
            Start Your Application <ChevronRight size={16} />
          </a>
        </div>
      </section>
    </div>
  )
}