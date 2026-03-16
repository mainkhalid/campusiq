import React, { useEffect, useState, useCallback } from 'react'
import { Calendar, ArrowUpRight, ArrowRight, Loader2 } from 'lucide-react'
import api from '../api/axios'

const CAT = {
  news:         { label: 'News',         cls: 'bg-blue-100 text-blue-700'    },
  event:        { label: 'Event',        cls: 'bg-purple-100 text-purple-700' },
  announcement: { label: 'Announcement', cls: 'bg-amber-100 text-amber-700'  },
}

const FILTERS = [
  { label: 'All',           value: '' },
  { label: 'News',          value: 'news' },
  { label: 'Events',        value: 'event' },
  { label: 'Announcements', value: 'announcement' },
]

// Page size — hero takes 1 slot, cards take the rest
const PAGE_SIZE = 9

const fmtDate = (post) => {
  const d = post.category === 'event' && post.event_date
    ? new Date(post.event_date) : new Date(post.created_at)
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NewsEvents() {
  const [posts, setPosts]       = useState([])
  const [cat, setCat]           = useState('')
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextUrl, setNextUrl]   = useState(null)   // DRF next page URL
  const [total, setTotal]       = useState(0)

  // Build the initial URL — category filter applied server-side
  const buildUrl = useCallback((category) => {
    const params = new URLSearchParams({
      status:   'published',
      ordering: '-created_at',
      limit:    PAGE_SIZE,
      offset:   0,
    })
    if (category) params.set('category', category)
    return `/news/posts/?${params.toString()}`
  }, [])

  // Initial load / filter change
  useEffect(() => {
    setLoading(true)
    setPosts([])
    setNextUrl(null)

    api.get(buildUrl(cat))
      .then(res => {
        const body = res.data
        // DRF PageNumberPagination or LimitOffsetPagination
        if (body && typeof body === 'object' && 'results' in body) {
          setPosts(body.results ?? [])
          setNextUrl(body.next ?? null)
          setTotal(body.count ?? 0)
        } else {
          // Unpaginated response — treat as full list
          const list = Array.isArray(body) ? body : (body.data ?? [])
          setPosts(list)
          setNextUrl(null)
          setTotal(list.length)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [cat, buildUrl])

  const loadMore = async () => {
    if (!nextUrl || loadingMore) return
    setLoadingMore(true)
    try {
      // nextUrl is an absolute URL from DRF — extract the path+query
      const url = nextUrl.replace(/^https?:\/\/[^/]+/, '')
      const res  = await api.get(url)
      const body = res.data
      if (body && 'results' in body) {
        setPosts(prev => [...prev, ...(body.results ?? [])])
        setNextUrl(body.next ?? null)
      }
    } catch {
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) return (
    <section className="py-20 bg-white" id="news">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      </div>
    </section>
  )

  if (!loading && posts.length === 0) return null

  const hero = posts[0]
  const rest  = posts.slice(1)

  return (
    <section className="py-20 bg-white" id="news">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header row */}
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Latest Updates</p>
            <h2 className="text-4xl font-black text-[#1a2b4c]">News & Events</h2>
            {total > 0 && (
              <p className="text-xs text-slate-400 mt-1">{total} {total === 1 ? 'post' : 'posts'}</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f.value} onClick={() => setCat(f.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  cat === f.value
                    ? 'bg-[#1a2b4c] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero + first batch */}
        <div className="grid lg:grid-cols-5 gap-5 mb-5">

          {/* Hero card */}
          {hero && (
            <div
              onClick={() => hero.external_link && window.open(hero.external_link, '_blank')}
              className={`lg:col-span-2 bg-[#1a2b4c] rounded-2xl p-8 flex flex-col justify-between min-h-80 ${hero.external_link ? 'cursor-pointer group' : ''}`}>
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${CAT[hero.category]?.cls || 'bg-slate-100 text-slate-600'}`}>
                    {CAT[hero.category]?.label || hero.category}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <Calendar size={11} />{fmtDate(hero)}
                  </span>
                </div>
                <h3 className="text-white text-xl font-black leading-snug mb-4">{hero.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed line-clamp-6">{hero.content}</p>
                {hero.tags?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-4">
                    {hero.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-white/10 text-slate-300 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              {hero.external_link && (
                <div className="mt-6 flex items-center gap-2 text-orange-400 text-xs font-bold group-hover:text-orange-300 transition-colors">
                  Read full story <ArrowUpRight size={13} />
                </div>
              )}
            </div>
          )}

          {/* Right column — first 4 cards alongside hero */}
          <div className="lg:col-span-3 flex flex-col gap-0 divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
            {rest.slice(0, 4).map(post => (
              <PostRow key={post.id} post={post} />
            ))}
            {rest.length === 0 && (
              <p className="text-slate-400 text-sm text-center p-10">No more posts.</p>
            )}
          </div>
        </div>

        {/* Additional posts — full-width rows after the hero section */}
        {rest.length > 4 && (
          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white divide-y divide-slate-100 mb-5">
            {rest.slice(4).map(post => (
              <PostRow key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Load more */}
        {nextUrl && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              {loadingMore
                ? <><Loader2 size={15} className="animate-spin" /> Loading...</>
                : <>Load more <ArrowRight size={15} /></>
              }
            </button>
          </div>
        )}

        {/* End of posts indicator */}
        {!nextUrl && posts.length > PAGE_SIZE && (
          <p className="text-center text-xs text-slate-400 mt-6">
            All {total} posts loaded
          </p>
        )}

      </div>
    </section>
  )
}

// ── Extracted row component ───────────────────────────────────────────────────
function PostRow({ post }) {
  return (
    <div
      onClick={() => post.external_link && window.open(post.external_link, '_blank')}
      className={`flex gap-5 items-start px-6 py-5 hover:bg-slate-50 transition-colors group ${post.external_link ? 'cursor-pointer' : ''}`}
    >
      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
        post.category === 'news'         ? 'bg-blue-400'   :
        post.category === 'event'        ? 'bg-purple-400' :
        post.category === 'announcement' ? 'bg-amber-400'  : 'bg-slate-300'
      }`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${CAT[post.category]?.cls || 'bg-slate-100 text-slate-500'}`}>
            {CAT[post.category]?.label || post.category}
          </span>
          <span className="text-slate-400 text-[10px] flex items-center gap-1">
            <Calendar size={9} />
            {post.category === 'event' && post.event_date
              ? new Date(post.event_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
              : new Date(post.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
            }
          </span>
          {post.author && (
            <span className="text-slate-400 text-[10px] hidden sm:inline">· {post.author}</span>
          )}
        </div>
        <h4 className="font-black text-[#1a2b4c] text-sm leading-snug mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
          {post.title}
        </h4>
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{post.content}</p>
        {post.tags?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {post.tags.slice(0, 2).map(t => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>

      {post.external_link && (
        <ArrowUpRight size={14} className="text-slate-300 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-1" />
      )}
    </div>
  )
}