import React, { useState, useEffect, useCallback } from 'react'
import {
  Bot, Save, Eye, EyeOff, Loader2, Check, AlertTriangle,
  Zap, X, Shield, Database, MessageSquare, RefreshCw,
  Moon, Info, Clock, GraduationCap, HelpCircle, Calendar,
  Award, Microscope, Globe, Newspaper
} from 'lucide-react'
import api from '../../api/axios'

// ── Primitives ────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  )
}

function Field({ label, hint, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      {hint && <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p>}
      {children}
    </div>
  )
}

const inputCls = "w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/15 focus:border-[#1a2b4c] transition-all bg-white placeholder:text-slate-300"
const textareaCls = inputCls + " resize-none leading-relaxed"

function SecretInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange}
        placeholder={placeholder} className={inputCls + ' pr-10'} />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

function EnvBadge({ envKey }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">
      .env: {envKey}
    </span>
  )
}

function SaveButton({ saving, onClick }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-6 py-2.5 bg-[#1a2b4c] text-white rounded-lg text-sm font-bold hover:bg-[#243660] disabled:opacity-50 transition-all shadow-sm">
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {saving ? 'Saving...' : 'Save Changes'}
    </button>
  )
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-slate-100" />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

function SectionCard({ id, icon: Icon, color, title, subtitle, children }) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-8 py-8">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint && <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors mt-0.5 ${
          checked ? 'bg-[#1a2b4c]' : 'bg-slate-200'
        }`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  )
}

function InfoBox({ children }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 leading-relaxed">
      <Info size={13} className="flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  )
}

// ── Nav config ────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'ai',          label: 'AI & Models',      icon: Bot           },
  { id: 'chat',        label: 'Chat Behaviour',    icon: MessageSquare },
  { id: 'sources',     label: 'Data Sources',      icon: Database      },
  { id: 'security',    label: 'Security & Limits', icon: Shield        },
  { id: 'scraping',    label: 'Scrape Schedule',   icon: RefreshCw     },
  { id: 'maintenance', label: 'Maintenance',       icon: Moon          },
]

// ── Section defaults (mirror service.py / backend DEFAULTS) ──────────────────
const D = {
  ai: {
    openrouter_api_key: '', fast_model: 'arcee-ai/trinity-mini:free',
    smart_model: 'arcee-ai/trinity-large-preview:free',
    embedding_backend: 'local', embedding_model: '',
    temperature: 0.7, max_tokens: 900, timeout: 30,
  },
  chat: {
    greeting_message: "Hello! 👋 I'm your Zetech University assistant. How can I help you today?",
    bot_name: 'Zetech AI', custom_system_prompt: '', typing_indicator: true,
    fallback_message: "I'm sorry, I don't have information on that. Please contact the admissions office.",
  },
  sources: {
    use_programmes: true, use_faqs: true, use_timetable: true,
    use_research: true, use_scholarships: true,
    use_external_sources: true, use_news: true,
  },
  security: {
    rate_limit_enabled: true, rate_limit_per_hour: 30,
    max_message_length: 500, max_conversation_turns: 20,
    block_off_topic: false, require_auth: false,
  },
  scraping: {
    auto_scrape_enabled: false, scrape_interval_hours: 24,
    scrape_main_site: true, scrape_research_site: true, scrape_news_site: true,
    last_scraped_at: null, next_scrape_at: null,
  },
  maintenance: {
    maintenance_mode: false,
    maintenance_message: 'The AI assistant is temporarily unavailable for maintenance. Please check back shortly.',
    disable_scraping: false, read_only_mode: false,
  },
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [activeSection, setActive]  = useState('ai')

  const [ai, setAi]               = useState(D.ai)
  const [chat, setChat]           = useState(D.chat)
  const [sources, setSources]     = useState(D.sources)
  const [security, setSecurity]   = useState(D.security)
  const [scraping, setScraping]   = useState(D.scraping)
  const [maintenance, setMaintenance] = useState(D.maintenance)

  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/settings/system/')
      const d   = res.data.data || {}
      if (d.ai)          setAi(p          => ({ ...p, ...d.ai }))
      if (d.chat)        setChat(p        => ({ ...p, ...d.chat }))
      if (d.sources)     setSources(p     => ({ ...p, ...d.sources }))
      if (d.security)    setSecurity(p    => ({ ...p, ...d.security }))
      if (d.scraping)    setScraping(p    => ({ ...p, ...d.scraping }))
      if (d.maintenance) setMaintenance(p => ({ ...p, ...d.maintenance }))
    } catch {
      showToast('Failed to load settings', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])

  const save = async (section, data) => {
    setSaving(true)
    try {
      await api.patch('/settings/system/', { section, data })
      showToast('Settings saved')
    } catch {
      showToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const scrollTo = id => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-80">
      <Loader2 className="animate-spin text-[#1a2b4c]" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1a2b4c]">System Settings</h1>
          <p className="text-sm text-slate-400 mt-1">AI configuration, chatbot behaviour, and platform controls</p>
        </div>
        <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full font-semibold">
          DB values override .env defaults
        </span>
      </div>

      <div className="flex gap-8 items-start">

        {/* Sticky nav */}
        <div className="w-52 flex-shrink-0 sticky top-6">
          <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                  ${activeSection === id ? 'bg-[#1a2b4c] text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                <Icon size={15} className="flex-shrink-0" />{label}
              </button>
            ))}
          </nav>
          <div className="mt-4 bg-gradient-to-br from-[#1a2b4c] to-[#243660] rounded-2xl p-4 text-white">
            <Zap size={15} className="text-amber-400 mb-2" />
            <p className="text-xs font-bold mb-1">Live updates</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">Changes apply immediately — no server restart needed.</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* ══ AI & MODELS ══════════════════════════════════════════ */}
          <SectionCard id="ai" icon={Bot} color="bg-violet-500"
            title="AI & Models" subtitle="Language models, embeddings, and API credentials">
            <div className="space-y-8">

              <div>
                <Divider label="API Credentials" />
                <div className="mt-5">
                  <Field label="OpenRouter API Key" hint="Overrides OPENROUTER_API_KEY in your .env">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <SecretInput value={ai.openrouter_api_key}
                          onChange={e => setAi(p => ({ ...p, openrouter_api_key: e.target.value }))}
                          placeholder="sk-or-... (leave blank to use .env value)" />
                      </div>
                      <EnvBadge envKey="OPENROUTER_API_KEY" />
                    </div>
                  </Field>
                </div>
              </div>

              <div>
                <Divider label="Language Models" />
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <Field label="Fast Model" hint="Greetings and simple queries — lightweight free model">
                      <input className={inputCls} value={ai.fast_model}
                        onChange={e => setAi(p => ({ ...p, fast_model: e.target.value }))}
                        placeholder="arcee-ai/trinity-mini:free" />
                    </Field>
                    <Field label="Smart Model" hint="Used when DB data is injected — needs stronger reasoning">
                      <input className={inputCls} value={ai.smart_model}
                        onChange={e => setAi(p => ({ ...p, smart_model: e.target.value }))}
                        placeholder="arcee-ai/trinity-large-preview:free" />
                    </Field>
                  </div>
                  <InfoBox>
                    The smart model activates when programmes, news, research or timetable data is retrieved.
                    Both models must be available on your OpenRouter account.
                  </InfoBox>
                </div>
              </div>

              <div>
                <Divider label="Embeddings" />
                <div className="mt-5 grid grid-cols-2 gap-6">
                  <Field label="Embedding Backend">
                    <select className={inputCls} value={ai.embedding_backend}
                      onChange={e => setAi(p => ({ ...p, embedding_backend: e.target.value }))}>
                      <option value="local">Local (sentence-transformers) — free</option>
                      <option value="openrouter">OpenRouter API — paid</option>
                    </select>
                  </Field>
                  <Field label="Embedding Model"
                    hint={ai.embedding_backend === 'local' ? 'Default: all-MiniLM-L6-v2' : 'Default: qwen/qwen3-embedding-0.6b'}>
                    <input className={inputCls} value={ai.embedding_model}
                      onChange={e => setAi(p => ({ ...p, embedding_model: e.target.value }))}
                      placeholder={ai.embedding_backend === 'local' ? 'all-MiniLM-L6-v2' : 'qwen/qwen3-embedding-0.6b'} />
                  </Field>
                </div>
              </div>

              <div>
                <Divider label="Inference Limits" />
                <div className="mt-5 grid grid-cols-3 gap-6">
                  <Field label="Temperature" hint="0 = focused · 1 = creative">
                    <input type="number" className={inputCls} value={ai.temperature}
                      onChange={e => setAi(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                      min={0} max={1} step={0.1} />
                  </Field>
                  <Field label="Max Tokens" hint="Max per response">
                    <input type="number" className={inputCls} value={ai.max_tokens}
                      onChange={e => setAi(p => ({ ...p, max_tokens: parseInt(e.target.value) }))}
                      min={100} max={4000} />
                  </Field>
                  <Field label="Timeout (s)" hint="Before fallback fires">
                    <input type="number" className={inputCls} value={ai.timeout}
                      onChange={e => setAi(p => ({ ...p, timeout: parseInt(e.target.value) }))}
                      min={10} max={120} />
                  </Field>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <SaveButton saving={saving} onClick={() => save('ai', ai)} />
              </div>
            </div>
          </SectionCard>

          {/* ══ CHAT BEHAVIOUR ═══════════════════════════════════════ */}
          <SectionCard id="chat" icon={MessageSquare} color="bg-blue-500"
            title="Chat Behaviour" subtitle="Greeting, identity, fallback messages, and custom instructions">
            <div className="space-y-8">

              <div>
                <Divider label="Bot Identity" />
                <div className="mt-5 grid grid-cols-2 gap-6">
                  <Field label="Bot Name" hint="Shown in the chat widget header">
                    <input className={inputCls} value={chat.bot_name}
                      onChange={e => setChat(p => ({ ...p, bot_name: e.target.value }))}
                      placeholder="Zetech AI" />
                  </Field>
                  <Field label="Typing Indicator" hint="Show animated dots while the bot is processing">
                    <div className="pt-1">
                      <Toggle checked={chat.typing_indicator}
                        onChange={v => setChat(p => ({ ...p, typing_indicator: v }))}
                        label="Show typing indicator" />
                    </div>
                  </Field>
                </div>
              </div>

              <div>
                <Divider label="Messages" />
                <div className="mt-5 space-y-5">
                  <Field label="Greeting Message" hint="Sent automatically when a student opens the chat">
                    <textarea className={textareaCls} rows={2} value={chat.greeting_message}
                      onChange={e => setChat(p => ({ ...p, greeting_message: e.target.value }))}
                      placeholder="Hello! 👋 I'm your Zetech University assistant..." />
                  </Field>
                  <Field label="Fallback Message" hint="Shown when the bot has no data and cannot answer">
                    <textarea className={textareaCls} rows={2} value={chat.fallback_message}
                      onChange={e => setChat(p => ({ ...p, fallback_message: e.target.value }))}
                      placeholder="I'm sorry, I don't have information on that..." />
                  </Field>
                </div>
              </div>

              <div>
                <Divider label="Custom System Prompt" />
                <div className="mt-5 space-y-3">
                  <Field label="Additional Instructions"
                    hint="Prepended to every system prompt. Use for tone rules, restrictions, or university-specific behaviour.">
                    <textarea className={textareaCls} rows={6} value={chat.custom_system_prompt}
                      onChange={e => setChat(p => ({ ...p, custom_system_prompt: e.target.value }))}
                      placeholder={`Examples:\n- Always respond in formal English\n- Never discuss competitor universities\n- When asked about fees, remind students to confirm with admissions`} />
                  </Field>
                  <InfoBox>
                    Keep this concise — long prompts consume tokens and leave less space for knowledge-base data.
                  </InfoBox>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <SaveButton saving={saving} onClick={() => save('chat', chat)} />
              </div>
            </div>
          </SectionCard>

          {/* ══ DATA SOURCES ═════════════════════════════════════════ */}
          <SectionCard id="sources" icon={Database} color="bg-emerald-500"
            title="Data Sources" subtitle="Control which knowledge sources the bot can access per query">
            <div className="space-y-4">
              <InfoBox>
                Disabling a source means the bot will never fetch that data — even if a student asks directly.
                Use this to hide incomplete or draft data from the public chatbot.
              </InfoBox>
              <div className="border border-slate-100 rounded-xl overflow-hidden px-5">
                {[
                  { key: 'use_programmes',       icon: GraduationCap, label: 'Programmes & Fees',  hint: 'Course listings, fee structures, entry requirements from the Programmes DB' },
                  { key: 'use_faqs',             icon: HelpCircle,    label: 'FAQs',               hint: 'Answers from the FAQ database — good for common admissions questions' },
                  { key: 'use_timetable',        icon: Calendar,      label: 'Timetable',          hint: 'Class schedules, sessions, and room allocations' },
                  { key: 'use_research',         icon: Microscope,    label: 'Research Projects',  hint: 'Published research projects from the Research DB' },
                  { key: 'use_news',             icon: Newspaper,     label: 'News & Events',      hint: 'Published news and event articles — fed by the scrapers' },
                  { key: 'use_scholarships',     icon: Award,         label: 'Scholarships',       hint: 'Active scholarships with open applications and valid deadlines' },
                  { key: 'use_external_sources', icon: Globe,         label: 'Crawled Web Chunks', hint: 'Semantic search over content crawled from external URLs (hostels, transport, clubs, etc.)' },
                ].map(({ key, icon: Icon, label, hint }) => (
                  <div key={key} className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-50 last:border-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${sources[key] ? 'bg-[#1a2b4c]' : 'bg-slate-100'}`}>
                        <Icon size={13} className={sources[key] ? 'text-orange-400' : 'text-slate-400'} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{hint}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSources(p => ({ ...p, [key]: !p[key] }))}
                      className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors mt-0.5 ${
                        sources[key] ? 'bg-[#1a2b4c]' : 'bg-slate-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        sources[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <SaveButton saving={saving} onClick={() => save('sources', sources)} />
              </div>
            </div>
          </SectionCard>

          {/* ══ SECURITY & LIMITS ════════════════════════════════════ */}
          <SectionCard id="security" icon={Shield} color="bg-rose-500"
            title="Security & Limits" subtitle="Rate limiting, message caps, and access controls">
            <div className="space-y-8">

              <div>
                <Divider label="Rate Limiting" />
                <div className="mt-5 space-y-4">
                  <div className="border border-slate-100 rounded-xl px-5">
                    <Toggle checked={security.rate_limit_enabled}
                      onChange={v => setSecurity(p => ({ ...p, rate_limit_enabled: v }))}
                      label="Enable rate limiting"
                      hint="Limits messages per IP per hour — prevents LLM API abuse" />
                  </div>
                  {security.rate_limit_enabled && (
                    <Field label="Messages per IP per Hour"
                      hint="Recommended: 20–50. Campus Wi-Fi shares one IP — set generously.">
                      <input type="number" className={inputCls} value={security.rate_limit_per_hour}
                        onChange={e => setSecurity(p => ({ ...p, rate_limit_per_hour: parseInt(e.target.value) }))}
                        min={5} max={500} />
                    </Field>
                  )}
                  <InfoBox>
                    Rate limiting requires Django cache (Redis or LocMem). Each IP resets hourly.
                  </InfoBox>
                </div>
              </div>

              <div>
                <Divider label="Message & Conversation Limits" />
                <div className="mt-5 grid grid-cols-2 gap-6">
                  <Field label="Max Message Length (chars)"
                    hint="Reject messages longer than this — prevents prompt injection and token abuse.">
                    <input type="number" className={inputCls} value={security.max_message_length}
                      onChange={e => setSecurity(p => ({ ...p, max_message_length: parseInt(e.target.value) }))}
                      min={100} max={5000} />
                  </Field>
                  <Field label="Max Conversation Turns"
                    hint="History beyond this is dropped. Keeps context bounded and prevents runaway costs.">
                    <input type="number" className={inputCls} value={security.max_conversation_turns}
                      onChange={e => setSecurity(p => ({ ...p, max_conversation_turns: parseInt(e.target.value) }))}
                      min={5} max={100} />
                  </Field>
                </div>
              </div>

              <div>
                <Divider label="Access Control" />
                <div className="mt-4 border border-slate-100 rounded-xl px-5">
                  <Toggle checked={security.block_off_topic}
                    onChange={v => setSecurity(p => ({ ...p, block_off_topic: v }))}
                    label="Block off-topic questions"
                    hint="Instructs the bot to decline questions unrelated to university matters" />
                  <Toggle checked={security.require_auth}
                    onChange={v => setSecurity(p => ({ ...p, require_auth: v }))}
                    label="Require authentication to chat"
                    hint="Only logged-in users can use the chatbot — useful for protecting timetable and fee data" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <SaveButton saving={saving} onClick={() => save('security', security)} />
              </div>
            </div>
          </SectionCard>

          {/* ══ SCRAPE SCHEDULE ══════════════════════════════════════ */}
          <SectionCard id="scraping" icon={RefreshCw} color="bg-amber-500"
            title="Scrape Schedule" subtitle="Automated content refresh from external university websites">
            <div className="space-y-6">

              <div className="border border-slate-100 rounded-xl px-5">
                <Toggle checked={scraping.auto_scrape_enabled}
                  onChange={v => setScraping(p => ({ ...p, auto_scrape_enabled: v }))}
                  label="Enable automatic scraping"
                  hint="Periodically re-crawls configured sources and updates the knowledge base" />
              </div>

              {scraping.auto_scrape_enabled && (
                <Field label="Scrape Interval (hours)"
                  hint="How often to re-crawl all active sources. Minimum 6 hours.">
                  <input type="number" className={inputCls} value={scraping.scrape_interval_hours}
                    onChange={e => setScraping(p => ({ ...p, scrape_interval_hours: parseInt(e.target.value) }))}
                    min={6} max={168} />
                </Field>
              )}

              <div>
                <Divider label="Sources to Auto-Scrape" />
                <div className="mt-4 border border-slate-100 rounded-xl px-5">
                  <Toggle checked={scraping.scrape_main_site}
                    onChange={v => setScraping(p => ({ ...p, scrape_main_site: v }))}
                    label="Main university site"
                    hint="Crawls zetech.ac.ke sources (student life, programmes, hostels, etc.) and runs the main news scraper" />
                  <Toggle checked={scraping.scrape_research_site}
                    onChange={v => setScraping(p => ({ ...p, scrape_research_site: v }))}
                    label="Research directorate"
                    hint="Crawls research.zetech.ac.ke sources and runs the structured research scraper (news articles + projects)" />
                  <Toggle checked={scraping.scrape_news_site}
                    onChange={v => setScraping(p => ({ ...p, scrape_news_site: v }))}
                    label="News scraper only"
                    hint="Runs only the structured news scraper — does not affect web crawl sources. Disable to pause news imports without stopping other crawls." />
                </div>
              </div>

              {(scraping.last_scraped_at || scraping.next_scrape_at) && (
                <div className="grid grid-cols-2 gap-4">
                  {scraping.last_scraped_at && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={11} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Last scrape</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {new Date(scraping.last_scraped_at).toLocaleString('en-KE')}
                      </p>
                    </div>
                  )}
                  {scraping.next_scrape_at && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={11} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Next scrape</span>
                      </div>
                      <p className="text-sm font-semibold text-amber-700">
                        {new Date(scraping.next_scrape_at).toLocaleString('en-KE')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <InfoBox>
                Auto-scraping requires Celery (or a cron job) calling{' '}
                <code className="font-mono bg-blue-100 px-1 rounded">POST /api/crawler/run/</code> on schedule.
                The interval set here is read by the task scheduler.
              </InfoBox>

              <div className="flex justify-end pt-2">
                <SaveButton saving={saving} onClick={() => {
                  // Strip scheduler-managed timestamps — never overwrite from UI
                  const { last_scraped_at, next_scrape_at, ...scrapingConfig } = scraping
                  save('scraping', scrapingConfig)
                }} />
              </div>
            </div>
          </SectionCard>

          {/* ══ MAINTENANCE ══════════════════════════════════════════ */}
          <SectionCard id="maintenance" icon={Moon} color="bg-slate-600"
            title="Maintenance" subtitle="Take the chatbot offline or freeze the knowledge base">
            <div className="space-y-6">

              <div className="border border-slate-100 rounded-xl px-5">
                <Toggle checked={maintenance.maintenance_mode}
                  onChange={v => setMaintenance(p => ({ ...p, maintenance_mode: v }))}
                  label="Maintenance mode"
                  hint="Immediately stops the bot from responding — returns the maintenance message to students" />
                <Toggle checked={maintenance.read_only_mode}
                  onChange={v => setMaintenance(p => ({ ...p, read_only_mode: v }))}
                  label="Read-only mode"
                  hint="Bot answers questions but all DB writes and scraping are disabled — safe for data audits" />
                <Toggle checked={maintenance.disable_scraping}
                  onChange={v => setMaintenance(p => ({ ...p, disable_scraping: v }))}
                  label="Pause all scraping"
                  hint="Stops both manual and automatic scrapes without disabling the chatbot" />
              </div>

              {maintenance.maintenance_mode && (
                <Field label="Maintenance Message" hint="Shown to students instead of a bot response">
                  <textarea className={textareaCls} rows={3} value={maintenance.maintenance_message}
                    onChange={e => setMaintenance(p => ({ ...p, maintenance_message: e.target.value }))}
                    placeholder="The AI assistant is temporarily unavailable..." />
                </Field>
              )}

              {maintenance.maintenance_mode && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-semibold leading-relaxed">
                    Maintenance mode is ON. Students cannot use the chatbot right now.
                    Remember to turn this off when maintenance is complete.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <SaveButton saving={saving} onClick={() => save('maintenance', maintenance)} />
              </div>
            </div>
          </SectionCard>

          <div className="h-8" />
        </div>
      </div>
    </div>
  )
}