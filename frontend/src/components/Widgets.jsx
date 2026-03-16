import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, RefreshCw, Sparkles, ChevronRight } from 'lucide-react'
import api from '../api/axios'

const DEFAULT_GREETING = "Hi there! 👋 I'm your Zetech University assistant. Ask me about programmes, fees, admissions, hostels — anything!"

// ── Typing indicator dots ──────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0,1,2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }} />
      ))}
    </div>
  )
}

// ── Message markdown renderer ──────────────────────────────
function Msg({ text }) {
  // Strip markdown links [label](url) → label only, and bare URLs
  const sanitize = (str) =>
    str
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .trim()

  return (
    <div className="text-sm leading-relaxed space-y-0.5">
      {text.split('\n').map((line, i) => {
        const isBullet = /^[-*•]\s+/.test(line)
        const raw      = isBullet ? line.replace(/^[-*•]\s+/, '') : line
        const content  = sanitize(raw)
        const parts    = content.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
          /^\*\*[^*]+\*\*$/.test(p) ? <strong key={j}>{p.slice(2,-2)}</strong> : p
        )
        if (isBullet) return (
          <div key={i} className="flex gap-2">
            <span className="text-orange-400 flex-shrink-0 font-bold mt-0.5">·</span>
            <span>{parts}</span>
          </div>
        )
        if (!content.trim()) return <div key={i} className="h-1.5" />
        return <div key={i}>{parts}</div>
      })}
    </div>
  )
}

// ── WhatsApp SVG ───────────────────────────────────────────
function WaIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  )
}

export default function Widgets() {
  const [open, setOpen]               = useState(false)
  const [greeting, setGreeting]       = useState(DEFAULT_GREETING)
  const [greetingLoaded, setLoaded]   = useState(false)
  const [messages, setMessages]       = useState([])
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [quickActions, setQA]         = useState([])
  const [qaLoading, setQALoading]     = useState(true)
  const [chatId, setChatId]           = useState(null)
  const [showTeaser, setShowTeaser]   = useState(false)
  const [hasError, setHasError]       = useState(false)
  const [activeTopic, setActiveTopic] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadConfig()
    const t = setTimeout(() => setShowTeaser(true), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const loadConfig = async () => {
    try {
      const [settRes, qaRes] = await Promise.allSettled([
        api.get('/aiconfig/settings/'),
        api.get('/aibot/quick-actions/'),
      ])
      const greet = settRes.status === 'fulfilled'
        ? (settRes.value.data?.data?.greeting_message || DEFAULT_GREETING)
        : DEFAULT_GREETING
      setGreeting(greet)
      setMessages([{ role: 'assistant', content: greet }])
      setLoaded(true)

      const qa = qaRes.status === 'fulfilled' && qaRes.value.data?.success
        ? qaRes.value.data.data : FALLBACK_QA
      setQA(qa)
    } catch {
      setGreeting(DEFAULT_GREETING)
      setMessages([{ role: 'assistant', content: DEFAULT_GREETING }])
      setLoaded(true)
      setQA(FALLBACK_QA)
    } finally {
      setQALoading(false)
    }
  }

  // Minimal fallback — only actions that don't require a specific data source,
  // shown when /aibot/quick-actions/ is unreachable. The real list from the
  // server is filtered by whichever sources are enabled in SystemSettings.
  const FALLBACK_QA = [
    { id: 'apply', text: '📝 How to Apply', query: 'How do I apply to Zetech?',        category: 'action' },
    { id: 'req',   text: 'Requirements',    query: 'What are the entry requirements?', category: 'action' },
  ]

  const send = async (msg) => {
    const text = msg || input
    if (!text.trim() || loading) return
    setInput('')
    setHasError(false)
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await api.post('/aibot/chat/', { message: text, chat_id: chatId, active_topic: activeTopic })
      const bot = res.data.data
      setMessages(prev => [...prev, { role: 'assistant', content: bot.response }])
      if (bot.chat_id) setChatId(bot.chat_id)
      if (bot.active_topic) setActiveTopic(bot.active_topic)
    } catch {
      setHasError(true)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection issue. Try again or reach us at admissions@zetech.ac.ke · +254 709 912 000',
      }])
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setMessages([{ role: 'assistant', content: greeting }])
    setChatId(null)
    setActiveTopic(null)
    setHasError(false)
  }

  const groupedQA = quickActions.reduce((acc, a) => {
    const c = a.category || 'other'
    if (!acc[c]) acc[c] = []
    acc[c].push(a)
    return acc
  }, {})

  const catLabels = {
    browse: 'Browse',
    field:  'By Field',
    info:   'Info',
    action: 'Quick',
  }

  return (
    <>
      {/* ── WhatsApp ── */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => window.open(`https://wa.me/254746071362?text=${encodeURIComponent("Hello! I'm interested in Zetech University.")}`, '_blank')}
          className="bg-green-500 hover:bg-green-400 text-white rounded-full p-3.5 shadow-lg transition-all hover:scale-110 group relative"
          aria-label="WhatsApp">
          <WaIcon />
          <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
            Chat on WhatsApp
          </span>
        </button>
      </div>

      {/* ── Chat widget ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

        {open && (
          <div className="mb-4 w-[350px] sm:w-[380px] h-[580px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-200 bg-white"
            style={{ animation: 'slideUp 200ms ease-out' }}>

            {/* Header */}
            <div className="bg-[#1a2b4c] px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-black text-white text-sm">Z</div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[#1a2b4c] rounded-full" />
                </div>
                <div>
                  <p className="text-white font-black text-sm leading-tight">Zetech AI</p>
                  <p className="text-green-400 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    {hasError ? 'Reconnecting...' : 'Online · replies instantly'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clear} title="New conversation"
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
                  <RefreshCw size={14} />
                </button>
                <button onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 space-y-3 text-sm">

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-[#1a2b4c] flex items-center justify-center font-black text-white text-[10px] flex-shrink-0 mt-0.5">Z</div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    m.role === 'user'
                      ? 'bg-[#1a2b4c] text-white rounded-tr-sm'
                      : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
                  }`}>
                    <Msg text={m.content} />
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-[#1a2b4c] flex items-center justify-center font-black text-white text-[10px] flex-shrink-0">Z</div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm">
                    <TypingDots />
                  </div>
                </div>
              )}

              {/* Quick actions — only on first message */}
              {greetingLoaded && messages.length === 1 && !loading && (
                <div className="pt-1 space-y-3">
                  {qaLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Loader2 size={12} className="animate-spin" /> Loading…
                    </div>
                  ) : (
                    Object.entries(groupedQA).map(([cat, acts]) => (
                      <div key={cat}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                          {catLabels[cat] || cat}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {acts.map(a => (
                            <button key={a.id} onClick={() => send(a.query)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 text-slate-600 font-bold rounded-full transition-all shadow-sm">
                              {a.text} <ChevronRight size={11} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
              <div className="flex gap-2 items-center">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder="Ask anything about Zetech…"
                  disabled={loading || !greetingLoaded}
                  className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60 transition-all"
                />
                <button onClick={() => send()} disabled={loading || !input.trim() || !greetingLoaded}
                  className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white flex items-center justify-center transition-all flex-shrink-0 shadow-sm">
                  <Send size={15} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Powered by Zetech AI · <a href="/contact" className="hover:text-orange-500 transition-colors">Contact us</a>
              </p>
            </div>
          </div>
        )}

        {/* Toggle */}
        <button onClick={() => { setOpen(o => !o); setShowTeaser(false) }}
          className={`relative w-14 h-14 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center ${
            open ? 'bg-slate-700 hover:bg-slate-600 rotate-0' : 'bg-[#1a2b4c] hover:bg-orange-500'
          }`}
          aria-label={open ? 'Close chat' : 'Open chat'}>
          <div className={`transition-all duration-300 ${open ? 'rotate-90 scale-90' : ''}`}>
            {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
          </div>

          {/* Pulse ring when closed */}
          {!open && (
            <span className="absolute inset-0 rounded-full bg-[#1a2b4c] animate-ping opacity-20 pointer-events-none" />
          )}

          {/* Unread badge */}
          {!open && messages.length > 1 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              {Math.min(messages.length - 1, 9)}
            </span>
          )}
        </button>

        {/* Teaser bubble */}
        {!open && showTeaser && greetingLoaded && (
          <div className="absolute bottom-20 right-0 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4"
            style={{ animation: 'slideUp 200ms ease-out' }}>
            <button onClick={(e) => { e.stopPropagation(); setShowTeaser(false) }}
              className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50">
              <X size={10} className="text-slate-500" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-orange-500" />
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">AI Assistant</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{greeting}</p>
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-slate-100 rotate-45" />
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}