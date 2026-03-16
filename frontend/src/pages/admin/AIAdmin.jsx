import React, { useState, useEffect, useCallback } from 'react'
import { Globe, FileText, Link, CheckCircle2, Clock, AlertTriangle, XCircle, Plus } from 'lucide-react'
import {
  Bot, BarChart2, MessageSquare, TrendingUp,
  RefreshCw, Trash2, Loader2, AlertCircle, CheckCircle,
  Users, Zap, Eye, EyeOff, Database, 
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { toast } from 'sonner'
import api from '../../api/axios'

// ── Tab config ────────────────────────────────────────────
const TABS = [
  { id: 'analytics', label: 'Analytics',       icon: BarChart2     },
  { id: 'logs',      label: 'Chat Logs',        icon: MessageSquare },
  { id: 'sources',   label: 'External Sources', icon: Globe         },
]

const TOPIC_COLORS = {
  programmes:   '#3b82f6',
  timetable:    '#f97316',
  admissions:   '#8b5cf6',
  fees:         '#10b981',
  scholarships: '#f43f5e',
  research:     '#06b6d4',
  general:      '#94a3b8',
  unknown:      '#e2e8f0',
}

const STATUS_CONFIG = {
  pending:    { icon: Clock,        color: 'text-slate-400', bg: 'bg-slate-100', label: 'Pending'    },
  crawling:   { icon: Loader2,      color: 'text-blue-500',  bg: 'bg-blue-50',   label: 'Crawling'   },
  processing: { icon: Loader2,      color: 'text-amber-500', bg: 'bg-amber-50',  label: 'Processing' },
  indexed:    { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50',  label: 'Indexed'    },
  failed:     { icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50',    label: 'Failed'     },
}

const TOPIC_LABELS = {
  programmes:   'Programmes',
  timetable:    'Timetable',
  admissions:   'Admissions',
  fees:         'Fees',
  scholarships: 'Scholarships',
  research:     'Research',
  general:      'General',
  unknown:      'Unknown',
}



// ── Skeleton loader ───────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`bg-slate-100 rounded-lg animate-pulse ${className}`} />
)

// ── Stat mini card ────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <div className="flex items-center gap-3">
        <div className={`${color} p-2 rounded-lg`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          {loading
            ? <Skeleton className="h-6 w-12 mb-1" />
            : <p className="text-2xl font-black text-[#1a2b4c] tabular-nums">{value}</p>
          }
          <p className="text-xs text-slate-400 font-medium">{label}</p>
        </div>
      </div>
    </div>
  )
}

// ── Toggle switch ─────────────────────────────────────────
function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/30 ${
        enabled ? 'bg-[#1a2b4c]' : 'bg-slate-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  )
}

// ── Inline confirm button — replaces window.confirm() ────
// Renders a "Delete?" state inline so the UI thread isn't blocked.
function DeleteButton({ onConfirm, size = 14, className = '' }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onConfirm(); setConfirming(false) }}
          className="text-[10px] font-bold px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirming(false) }}
          className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
      className={`p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ${className}`}
      title="Delete"
    >
      <Trash2 size={size} />
    </button>
  )
}

// ── Main component ────────────────────────────────────────
export default function AIAdmin() {
  const [tab, setTab] = useState('analytics')

  // Analytics
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats]               = useState(null)
  const [topics, setTopics]             = useState([])
  const [volume, setVolume]             = useState([])

  // Logs
  const [logs, setLogs]               = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  // FIX: keyed by conversation id instead of a single shared array
  // Prevents row B briefly showing row A's messages during concurrent fetches
  const [expandedLog, setExpandedLog]         = useState(null)
  const [messageCache, setMessageCache]       = useState({})
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [purgingLogs, setPurgingLogs]         = useState(false)

  // Analytics extras
  const [refreshingCache, setRefreshingCache] = useState(false)
  const [crawlStatus, setCrawlStatus]         = useState(null)
  const [crawlingAll, setCrawlingAll]         = useState(false)

  // Sources
  const [sources, setSources]               = useState([])
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [showAddSource, setShowAddSource]   = useState(false)
  const [addingSource, setAddingSource]     = useState(false)
  const [sourceForm, setSourceForm]         = useState({
    name: '', source_type: 'website', url: '', crawl_depth: 1, pdf_file: null,
  })

  // ── Loaders ───────────────────────────────────────────
  const loadAnalytics = useCallback(async () => {
    setStatsLoading(true)
    try {
      const [statsRes, topicsRes, volumeRes, crawlRes] = await Promise.allSettled([
        api.get('/aiconfig/logs/stats/'),
        api.get('/aiconfig/logs/topics/'),
        api.get('/aiconfig/logs/volume/'),
        api.get('/crawler/status/'),
      ])
      if (statsRes.status  === 'fulfilled') setStats(statsRes.value.data.data)
      if (topicsRes.status === 'fulfilled') setTopics(topicsRes.value.data.data)
      if (volumeRes.status === 'fulfilled') setVolume(volumeRes.value.data.data)
      if (crawlRes.status  === 'fulfilled') setCrawlStatus(crawlRes.value.data)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadSources = useCallback(async () => {
    setSourcesLoading(true)
    try {
      const res = await api.get('/crawler/sources/')
      setSources(res.data.results ?? res.data)
    } catch {
      toast.error('Failed to load sources')
    } finally {
      setSourcesLoading(false)
    }
  }, [])

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res = await api.get('/aiconfig/logs/top_questions/')
      setLogs(res.data.data)
    } catch {
      toast.error('Failed to load chat logs')
    } finally {
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  useEffect(() => {
    if (tab === 'logs')    loadLogs()
    if (tab === 'sources') loadSources()
  }, [tab, loadLogs, loadSources])

  const handleRefresh = () => {
    if (tab === 'analytics') loadAnalytics()
    if (tab === 'logs')      loadLogs()
    if (tab === 'sources')   loadSources()
  }

  // Invalidate server-side content cache
  const handleRefreshContentCache = async () => {
    setRefreshingCache(true)
    try {
      await api.post('/aiconfig/content/invalidate/')
      toast.success('Content cache cleared')
    } catch {
      toast.error('Failed to clear content cache')
    } finally {
      setRefreshingCache(false)
    }
  }

  // Crawl all active sources now
  const handleCrawlAll = async () => {
    setCrawlingAll(true)
    try {
      const res = await api.post('/crawler/run-all/')
      toast.success(res.data.detail || 'Crawl started')
      setTimeout(() => {
        loadAnalytics()
        loadSources()
      }, 2000)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start crawl')
    } finally {
      setCrawlingAll(false)
    }
  }

  // ── Log handlers ──────────────────────────────────────
  const handleDeleteLog = async (id) => {
    try {
      await api.delete(`/aiconfig/logs/${id}/`)
      setLogs(prev => prev.filter(l => l.id !== id))
      // Clear from message cache too
      setMessageCache(prev => { const n = { ...prev }; delete n[id]; return n })
      if (expandedLog === id) setExpandedLog(null)
      toast.success('Conversation deleted')
    } catch {
      toast.error('Failed to delete conversation')
    }
  }

  // Purge conversations older than 30 days
  const handlePurgeLogs = async () => {
    setPurgingLogs(true)
    try {
      const res = await api.delete('/aiconfig/logs/purge/')
      toast.success(`Purged ${res.data.deleted} conversations older than 30 days`)
      loadLogs()
    } catch {
      toast.error('Failed to purge logs')
    } finally {
      setPurgingLogs(false)
    }
  }

  // FIX: message cache keyed by id — no more shared single array
  const fetchMessages = async (chatId) => {
    if (expandedLog === chatId) {
      setExpandedLog(null)
      return
    }
    setExpandedLog(chatId)
    // Return from cache if already fetched
    if (messageCache[chatId]) return

    setMessagesLoading(true)
    try {
      const res = await api.get(`/aiconfig/logs/conversations/${chatId}/`)
      setMessageCache(prev => ({ ...prev, [chatId]: res.data.data }))
    } catch {
      toast.error('Failed to load conversation history')
    } finally {
      setMessagesLoading(false)
    }
  }

  // ── Source handlers ───────────────────────────────────
  const handleSourceFormChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'pdf_file') {
      setSourceForm(prev => ({ ...prev, pdf_file: files[0] || null }))
    } else {
      setSourceForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleAddSource = async (e) => {
    e.preventDefault()
    setAddingSource(true)
    try {
      const fd = new FormData()
      fd.append('name',        sourceForm.name)
      fd.append('source_type', sourceForm.source_type)
      if (sourceForm.source_type !== 'pdf') {
        fd.append('url',         sourceForm.url)
        fd.append('crawl_depth', sourceForm.crawl_depth)
      }
      if (sourceForm.source_type === 'pdf' && sourceForm.pdf_file) {
        fd.append('pdf_file', sourceForm.pdf_file)
      }
      await api.post('/crawler/sources/', fd)
      toast.success('Source added — indexing started in background')
      setShowAddSource(false)
      setSourceForm({ name: '', source_type: 'website', url: '', crawl_depth: 1, pdf_file: null })
      loadSources()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add source')
    } finally {
      setAddingSource(false)
    }
  }

  const handleCrawlNow = async (id) => {
    try {
      await api.post(`/crawler/sources/${id}/crawl/`)
      toast.success('Re-crawl started')
      setTimeout(loadSources, 1500)
    } catch {
      toast.error('Failed to trigger crawl')
    }
  }

  const handleToggleSource = async (id) => {
    try {
      await api.patch(`/crawler/sources/${id}/toggle/`)
      loadSources()
    } catch {
      toast.error('Failed to toggle source')
    }
  }

  const handleDeleteSource = async (id) => {
    try {
      await api.delete(`/crawler/sources/${id}/`)
      toast.success('Source deleted')
      loadSources()
    } catch {
      toast.error('Failed to delete source')
    }
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#1a2b4c] p-2.5 rounded-xl">
              <Bot size={20} className="text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1a2b4c]">AI Control Panel</h1>
              <p className="text-sm text-slate-400">Monitor and configure the student chatbot</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === id
                  ? 'bg-[#1a2b4c] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ══ ANALYTICS TAB ═══════════════════════════════════ */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniStat label="Total Chats"       value={stats?.total}     icon={MessageSquare} color="bg-[#1a2b4c]"    loading={statsLoading} />
              <MiniStat label="Today"             value={stats?.today}     icon={TrendingUp}    color="bg-orange-500"   loading={statsLoading} />
              <MiniStat label="This Week"         value={stats?.this_week} icon={Users}         color="bg-blue-500"     loading={statsLoading} />
              <MiniStat label="Helpful Responses" value={stats ? `${stats.helpful_percent}%` : '—'} icon={CheckCircle} color="bg-emerald-500" loading={statsLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Volume chart */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <TrendingUp size={15} className="text-blue-500" />
                  Chat Volume — Last 30 Days
                </h3>
                {statsLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : volume.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={volume}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={d => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}` }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip labelFormatter={d => new Date(d).toLocaleDateString('en-KE')}
                        formatter={(v) => [v, 'Chats']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="count" stroke="#1a2b4c" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Topic breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <BarChart2 size={15} className="text-orange-500" />
                  Questions by Topic
                </h3>
                {statsLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : topics.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={topics} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="topic" tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={t => TOPIC_LABELS[t] || t} width={80} />
                      <Tooltip formatter={(v) => [v, 'Chats']} labelFormatter={t => TOPIC_LABELS[t] || t}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {topics.map(t => <Cell key={t.topic} fill={TOPIC_COLORS[t.topic] || '#94a3b8'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {topics.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Topic Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {topics.map(t => {
                    const total = topics.reduce((s, x) => s + x.count, 0)
                    const pct   = total ? Math.round((t.count / total) * 100) : 0
                    return (
                      <div key={t.topic} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50">
                        <span className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: TOPIC_COLORS[t.topic] || '#94a3b8' }} />
                        <div>
                          <p className="text-xs font-bold text-slate-700">{TOPIC_LABELS[t.topic] || t.topic}</p>
                          <p className="text-xs text-slate-400">{t.count} · {pct}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Crawl health + operations row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Crawl status */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Globe size={15} className="text-blue-500" /> Knowledge Base Health
                </h3>
                {crawlStatus ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Indexed',  value: crawlStatus.indexed,  color: 'text-green-600 bg-green-50'  },
                        { label: 'Failed',   value: crawlStatus.failed,   color: 'text-red-500  bg-red-50'    },
                        { label: 'Pending',  value: crawlStatus.pending,  color: 'text-slate-500 bg-slate-50' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className={`rounded-xl p-3 ${color.split(' ')[1]}`}>
                          <p className={`text-xl font-black ${color.split(' ')[0]}`}>{value ?? 0}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-1 space-y-1 text-xs text-slate-500">
                      {crawlStatus.last_scraped_at && (
                        <p className="flex items-center gap-1.5">
                          <Clock size={11} className="text-slate-400" />
                          Last crawl: {new Date(crawlStatus.last_scraped_at).toLocaleString('en-KE')}
                        </p>
                      )}
                      {crawlStatus.auto_scrape_enabled && crawlStatus.next_scrape_at && (
                        <p className="flex items-center gap-1.5">
                          <RefreshCw size={11} className="text-amber-500" />
                          Next auto: {new Date(crawlStatus.next_scrape_at).toLocaleString('en-KE')}
                        </p>
                      )}
                      {!crawlStatus.auto_scrape_enabled && (
                        <p className="flex items-center gap-1.5 text-slate-400 italic">
                          <RefreshCw size={11} />
                          Auto-crawl off — enable in Settings
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <Skeleton className="h-24 w-full" />
                )}
              </div>

              {/* Operations */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-700">Operations</h3>

                <button onClick={handleCrawlAll} disabled={crawlingAll}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2b4c] hover:bg-[#243660] text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 w-full justify-center">
                  {crawlingAll
                    ? <><Loader2 size={14} className="animate-spin" /> Crawling...</>
                    : <><RefreshCw size={14} /> Crawl All Sources Now</>
                  }
                </button>

                <button onClick={handleRefreshContentCache} disabled={refreshingCache}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 w-full justify-center">
                  {refreshingCache
                    ? <><Loader2 size={14} className="animate-spin" /> Clearing...</>
                    : <><Database size={14} /> Clear Content Cache</>
                  }
                </button>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Crawl all</strong> re-indexes every active website source immediately.
                  <br />
                  <strong>Clear cache</strong> forces Student Life and Research widgets to
                  reload their content on next visit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ LOGS TAB ════════════════════════════════════════ */}
        {tab === 'logs' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Recent Conversations</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest 20 student chat sessions</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Purge old logs button */}
                <button
                  onClick={handlePurgeLogs}
                  disabled={purgingLogs}
                  title="Delete conversations older than 30 days"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                >
                  {purgingLogs
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Trash2 size={12} />
                  }
                  Purge Old
                </button>
                <button onClick={loadLogs} disabled={logsLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all">
                  <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {logsLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 italic text-sm">
                No chat logs yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {logs.map(log => (
                  <div key={log.id} className="group">
                    <div
                      onClick={() => fetchMessages(log.id)}
                      className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#1a2b4c]/10 text-[#1a2b4c]">
                            {log.message_count} Messages
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md">
                            {log.id.split('-')[0]}...
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {new Date(log.created_at).toLocaleString('en-KE', {
                              day: 'numeric', month: 'short',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-1 truncate">
                          "{log.message}"
                        </p>
                      </div>
                      {/* FIX: inline confirm instead of window.confirm() */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                        <DeleteButton onConfirm={() => handleDeleteLog(log.id)} />
                      </div>
                    </div>

                    {/* FIX: reads from messageCache[log.id] not shared expandedMessages */}
                    {expandedLog === log.id && (
                      <div className="bg-slate-50/50 p-6 border-t border-slate-100 max-h-[500px] overflow-y-auto">
                        {messagesLoading && !messageCache[log.id] ? (
                          <div className="flex justify-center py-8 text-slate-400">
                            <Loader2 size={24} className="animate-spin" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(messageCache[log.id] || []).map((msg, idx) => (
                              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                  msg.role === 'user'
                                    ? 'bg-[#1a2b4c] text-white rounded-br-none'
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                                }`}>
                                  <div className="whitespace-pre-wrap">{msg.content}</div>
                                  <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ SOURCES TAB ═════════════════════════════════════ */}
        {tab === 'sources' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">External Knowledge Sources</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Add website URLs or PDF documents for the AI to learn from
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={loadSources}
                  className="p-2 border rounded-lg text-slate-500 hover:bg-slate-50">
                  <RefreshCw size={15} className={sourcesLoading ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => setShowAddSource(!showAddSource)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a2b4c] text-white rounded-xl font-semibold text-sm hover:bg-slate-800">
                  <Plus size={16} /> Add Source
                </button>
              </div>
            </div>

            {showAddSource && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4">New Knowledge Source</h3>
                <form onSubmit={handleAddSource} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Name *</label>
                      <input name="name" value={sourceForm.name} onChange={handleSourceFormChange}
                        required placeholder="e.g. Programme Catalogue"
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#1a2b4c]/20 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Type *</label>
                      <select name="source_type" value={sourceForm.source_type} onChange={handleSourceFormChange}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#1a2b4c]/20 outline-none">
                        <option value="website">Website URL</option>
                        <option value="sitemap">Sitemap URL</option>
                        <option value="pdf">PDF Document</option>
                      </select>
                    </div>
                  </div>

                  {sourceForm.source_type !== 'pdf' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">URL *</label>
                        <input name="url" value={sourceForm.url} onChange={handleSourceFormChange}
                          required type="url" placeholder="https://university.ac.ke/programmes"
                          className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#1a2b4c]/20 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                          Crawl Depth
                          <span className="text-slate-300 font-normal ml-1">(1 = this page only)</span>
                        </label>
                        <select name="crawl_depth" value={sourceForm.crawl_depth} onChange={handleSourceFormChange}
                          className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#1a2b4c]/20 outline-none">
                          <option value={1}>1 — This page only</option>
                          <option value={2}>2 — Page + linked pages</option>
                          <option value={3}>3 — Deep crawl</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {sourceForm.source_type === 'pdf' && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">PDF File *</label>
                      <label className="flex items-center gap-3 border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-[#1a2b4c] transition-colors">
                        <FileText size={20} className="text-slate-400" />
                        <div>
                          <p className="text-sm font-semibold text-slate-600">
                            {sourceForm.pdf_file ? sourceForm.pdf_file.name : 'Click to upload PDF'}
                          </p>
                          <p className="text-xs text-slate-400">Fee structures, prospectus, handbooks</p>
                        </div>
                        <input type="file" accept=".pdf" name="pdf_file"
                          onChange={handleSourceFormChange} className="hidden" />
                      </label>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowAddSource(false)}
                      className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-semibold">
                      Cancel
                    </button>
                    <button type="submit" disabled={addingSource}
                      className="flex items-center gap-2 px-5 py-2 bg-[#1a2b4c] text-white rounded-lg font-semibold text-sm hover:bg-slate-800 disabled:opacity-50">
                      {addingSource && <Loader2 size={14} className="animate-spin" />}
                      {addingSource ? 'Adding...' : 'Add & Index'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {sourcesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : sources.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
                <Globe size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No external sources yet.</p>
                <p className="text-slate-300 text-xs mt-1">Add a website URL or upload a PDF to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map(source => {
                  const statusCfg  = STATUS_CONFIG[source.status] || STATUS_CONFIG.pending
                  const StatusIcon = statusCfg.icon
                  const isLoading  = ['crawling', 'processing'].includes(source.status)
                  return (
                    <div key={source.id}
                      className={`bg-white rounded-xl border p-5 flex items-start gap-4 transition-all ${
                        source.active ? 'border-slate-200' : 'border-slate-100 opacity-60'
                      }`}>
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${source.source_type === 'pdf' ? 'bg-red-50' : 'bg-blue-50'}`}>
                        {source.source_type === 'pdf'
                          ? <FileText size={18} className="text-red-500" />
                          : <Globe size={18} className="text-blue-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-slate-800">{source.name}</h3>
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusCfg.bg} ${statusCfg.color}`}>
                            <StatusIcon size={10} className={isLoading ? 'animate-spin' : ''} />
                            {statusCfg.label}
                          </span>
                          {!source.active && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-400">
                              Inactive
                            </span>
                          )}
                        </div>
                        {source.url && (
                          <a href={source.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1 mb-1 truncate max-w-md">
                            <Link size={10} /> {source.url}
                          </a>
                        )}
                        {source.pdf_filename && (
                          <p className="text-xs text-slate-400 mb-1">📄 {source.pdf_filename}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                          <span>{source.chunk_count} chunks indexed</span>
                          {source.last_crawled && (
                            <span>Last indexed: {new Date(source.last_crawled).toLocaleString('en-KE', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}</span>
                          )}
                          {source.source_type !== 'pdf' && <span>Depth: {source.crawl_depth}</span>}
                        </div>
                        {source.status === 'failed' && source.error_message && (
                          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                            <AlertTriangle size={11} /> {source.error_message}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {source.source_type !== 'pdf' && (
                          <button onClick={() => handleCrawlNow(source.id)} disabled={isLoading}
                            title="Re-crawl now"
                            className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 disabled:opacity-40 transition-colors">
                            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                          </button>
                        )}
                        <button onClick={() => handleToggleSource(source.id)}
                          title={source.active ? 'Deactivate' : 'Activate'}
                          className="p-2 rounded-lg transition-colors text-slate-400 hover:bg-slate-50">
                          {source.active
                            ? <Eye size={15} className="text-green-500" />
                            : <EyeOff size={15} />
                          }
                        </button>
                        {/* FIX: inline confirm instead of window.confirm() */}
                        <DeleteButton onConfirm={() => handleDeleteSource(source.id)} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
              <p className="font-semibold mb-1">💡 How indexing works</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                When you add a source, it is crawled/extracted immediately in the background.
                Text is split into chunks, each chunk gets an embedding vector, and all chunks
                are stored in the database. When a student asks a question, the AI finds the
                most relevant chunks using cosine similarity and includes them in its context.
                Re-crawl any website source whenever the content changes.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}