import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, HelpCircle, Microscope, Award,
  Newspaper, Calendar, TrendingUp, RefreshCw,
  ArrowRight, CheckCircle, Clock, AlertCircle,
  BookOpen, Users, Activity, Zap
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

// ── Quick nav tiles ──────────────────────────────────────────
const NAV_TILES = [
  { label: 'Programmes',  path: '/admin/programmes', icon: GraduationCap, color: 'bg-blue-500'   },
  { label: 'FAQs',        path: '/admin/faqadmin',   icon: HelpCircle,    color: 'bg-amber-500'  },
  { label: 'Research',    path: '/admin/research',   icon: Microscope,    color: 'bg-emerald-500'},
  { label: 'Scholarships',path: '/admin/scholars',   icon: Award,         color: 'bg-rose-500'   },
  { label: 'News',        path: '/admin/news',        icon: Newspaper,     color: 'bg-indigo-500' },
  { label: 'Timetable',   path: '/admin/admissions', icon: Calendar,      color: 'bg-orange-500' },
]

// ── Fetch all stats in parallel ──────────────────────────────
const fetchAllStats = async () => {
  const [programmes, faqs, research, scholarships, news, timetables] =
    await Promise.allSettled([
      api.get('/programmes/programmes/'),
      api.get('/faq/faqs/'),
      api.get('/research/projects/'),
      api.get('/scholarships/scholarships/'),
      api.get('/news/posts/'),
      api.get('/timetable/timetables/'),
    ])

  const extract = (result) => {
    if (result.status === 'fulfilled') {
      const d = result.value.data
      // DRF paginated returns { count, results }
      // non-paginated returns array directly
      return {
        total:     d.count ?? (Array.isArray(d) ? d.length : d.results?.length ?? 0),
        items:     d.results ?? (Array.isArray(d) ? d : []),
        error:     false,
      }
    }
    return { total: 0, items: [], error: true }
  }

  return {
    programmes:  extract(programmes),
    faqs:        extract(faqs),
    research:    extract(research),
    scholarships:extract(scholarships),
    news:        extract(news),
    timetables:  extract(timetables),
  }
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, error, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group w-full bg-white rounded-2xl border border-slate-100 p-6 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]/20"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${color} p-3 rounded-xl`}>
          <Icon size={22} className="text-white" />
        </div>
        <ArrowRight
          size={16}
          className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {error ? (
        <div className="flex items-center gap-1.5 text-red-400 text-sm">
          <AlertCircle size={14} /> Failed to load
        </div>
      ) : (
        <div className="text-3xl font-black text-[#1a2b4c] mb-1 tabular-nums">
          {value ?? <span className="inline-block w-12 h-7 bg-slate-100 rounded animate-pulse" />}
        </div>
      )}

      <p className="text-sm font-semibold text-slate-500">{label}</p>
      {sub && !error && (
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      )}
    </button>
  )
}

// ── Recent item row ──────────────────────────────────────────
function RecentRow({ label, meta, status, statusColor }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{label}</p>
        {meta && <p className="text-xs text-slate-400 mt-0.5">{meta}</p>}
      </div>
      {status && (
        <span className={`flex-shrink-0 ml-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor}`}>
          {status}
        </span>
      )}
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchAllStats()
      setStats(data)
      setLastRefresh(new Date())
    } catch (e) {
      console.error('Dashboard fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Derived values ────────────────────────────────────────
  const publishedResearch    = stats?.research.items.filter(r => r.published).length ?? 0
  const activeScholarships   = stats?.scholarships.items.filter(
    s => s.published && s.applications_open
  ).length ?? 0
  const publishedNews        = stats?.news.items.filter(n => n.status === 'published').length ?? 0
  const publishedFaqs        = stats?.faqs.items.filter(f => f.status === 'published').length ?? 0

  // Recent items — latest 5 of each
  const recentResearch    = stats?.research.items.slice(0, 5) ?? []
  const recentScholarships = stats?.scholarships.items.slice(0, 5) ?? []
  const recentNews        = stats?.news.items.slice(0, 5) ?? []

  const totalContent = (stats?.programmes.total ?? 0)
    + (stats?.faqs.total ?? 0)
    + (stats?.research.total ?? 0)
    + (stats?.scholarships.total ?? 0)
    + (stats?.news.total ?? 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 font-medium">
              {greeting}{user?.first_name ? `, ${user.first_name}` : ''} 👋
            </p>
            <h1 className="text-2xl font-black text-[#1a2b4c] mt-0.5">
              Admin Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Clock size={11} />
              Last updated {lastRefresh.toLocaleTimeString('en-KE', {
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Overview banner ────────────────────────────── */}
        <div className="bg-[#1a2b4c] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-12 -right-4 w-56 h-56 bg-white/5 rounded-full" />

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                Total Content
              </p>
              <p className="text-4xl font-black tabular-nums">
                {loading
                  ? <span className="inline-block w-16 h-9 bg-white/10 rounded animate-pulse" />
                  : totalContent
                }
              </p>
              <p className="text-slate-300 text-xs mt-1">across all sections</p>
            </div>

            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                Programmes
              </p>
              <p className="text-4xl font-black tabular-nums">
                {loading
                  ? <span className="inline-block w-12 h-9 bg-white/10 rounded animate-pulse" />
                  : stats?.programmes.total ?? '—'
                }
              </p>
              <p className="text-slate-300 text-xs mt-1">in the catalogue</p>
            </div>

            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                Active Scholarships
              </p>
              <p className="text-4xl font-black tabular-nums text-orange-400">
                {loading
                  ? <span className="inline-block w-12 h-9 bg-white/10 rounded animate-pulse" />
                  : activeScholarships
                }
              </p>
              <p className="text-slate-300 text-xs mt-1">open for applications</p>
            </div>

            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                Timetable Uploads
              </p>
              <p className="text-4xl font-black tabular-nums">
                {loading
                  ? <span className="inline-block w-12 h-9 bg-white/10 rounded animate-pulse" />
                  : stats?.timetables.total ?? '—'
                }
              </p>
              <p className="text-slate-300 text-xs mt-1">uploaded this year</p>
            </div>
          </div>
        </div>

        {/* ── Stat cards ─────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Content Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              label="Programmes"
              value={stats?.programmes.total}
              icon={GraduationCap}
              color="bg-blue-500"
              error={stats?.programmes.error}
              onClick={() => navigate('/admin/programmes')}
            />
            <StatCard
              label="FAQs"
              value={stats?.faqs.total}
              icon={HelpCircle}
              color="bg-amber-500"
              sub={`${publishedFaqs} published`}
              error={stats?.faqs.error}
              onClick={() => navigate('/admin/faqadmin')}
            />
            <StatCard
              label="Research"
              value={stats?.research.total}
              icon={Microscope}
              color="bg-emerald-500"
              sub={`${publishedResearch} published`}
              error={stats?.research.error}
              onClick={() => navigate('/admin/research')}
            />
            <StatCard
              label="Scholarships"
              value={stats?.scholarships.total}
              icon={Award}
              color="bg-rose-500"
              sub={`${activeScholarships} active`}
              error={stats?.scholarships.error}
              onClick={() => navigate('/admin/scholars')}
            />
            <StatCard
              label="News Posts"
              value={stats?.news.total}
              icon={Newspaper}
              color="bg-indigo-500"
              sub={`${publishedNews} published`}
              error={stats?.news.error}
              onClick={() => navigate('/admin/news')}
            />
            <StatCard
              label="Timetables"
              value={stats?.timetables.total}
              icon={Calendar}
              color="bg-orange-500"
              error={stats?.timetables.error}
              onClick={() => navigate('/admin/admissions')}
            />
          </div>
        </div>

        {/* ── Quick nav ───────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {NAV_TILES.map(({ label, path, icon: Icon, color }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="group flex flex-col items-center gap-2 bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-xs font-bold text-slate-600">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Recent activity ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Recent Research */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Microscope size={16} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-700">Recent Research</h3>
              </div>
              <button
                onClick={() => navigate('/admin/research')}
                className="text-xs text-slate-400 hover:text-emerald-600 font-semibold transition-colors"
              >
                View all
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentResearch.length === 0 ? (
              <EmptySlate label="No research projects yet" />
            ) : (
              recentResearch.map(r => (
                <RecentRow
                  key={r.id}
                  label={r.title}
                  meta={r.department}
                  status={r.published ? 'Published' : 'Draft'}
                  statusColor={r.published
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                  }
                />
              ))
            )}
          </div>

          {/* Recent Scholarships */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-rose-500" />
                <h3 className="text-sm font-bold text-slate-700">Recent Scholarships</h3>
              </div>
              <button
                onClick={() => navigate('/admin/scholars')}
                className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors"
              >
                View all
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentScholarships.length === 0 ? (
              <EmptySlate label="No scholarships yet" />
            ) : (
              recentScholarships.map(s => (
                <RecentRow
                  key={s.id}
                  label={s.name}
                  meta={`Deadline: ${s.deadline
                    ? new Date(s.deadline).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })
                    : '—'
                  }`}
                  status={s.applications_open ? 'Open' : 'Closed'}
                  statusColor={s.applications_open
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-500'
                  }
                />
              ))
            )}
          </div>

          {/* Recent News */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Newspaper size={16} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-700">Recent News</h3>
              </div>
              <button
                onClick={() => navigate('/admin/news')}
                className="text-xs text-slate-400 hover:text-indigo-600 font-semibold transition-colors"
              >
                View all
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentNews.length === 0 ? (
              <EmptySlate label="No news posts yet" />
            ) : (
              recentNews.map(n => (
                <RecentRow
                  key={n.id}
                  label={n.title}
                  meta={new Date(n.created_at).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                  status={n.status === 'published' ? 'Live' : 'Draft'}
                  statusColor={n.status === 'published'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-500'
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* ── System status ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-[#1a2b4c]" />
            <h3 className="text-sm font-bold text-slate-700">System Status</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: 'Programmes API',   ok: !stats?.programmes.error  },
              { label: 'FAQ API',          ok: !stats?.faqs.error        },
              { label: 'Research API',     ok: !stats?.research.error    },
              { label: 'Scholarships API', ok: !stats?.scholarships.error},
              { label: 'News API',         ok: !stats?.news.error        },
              { label: 'Timetable API',    ok: !stats?.timetables.error  },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2">
                {loading ? (
                  <span className="w-2 h-2 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                ) : ok ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                )}
                <span className="text-xs text-slate-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────
function EmptySlate({ label }) {
  return (
    <div className="py-8 text-center">
      <p className="text-xs text-slate-400 italic">{label}</p>
    </div>
  )
}