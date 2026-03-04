import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar, Loader2 } from 'lucide-react'
import api from '../api/axios'

const CATEGORY_STYLES = {
  news:         'bg-blue-100 text-blue-700',
  event:        'bg-purple-100 text-purple-700',
  announcement: 'bg-amber-100 text-amber-700',
}

const NewsEvents = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get('/news/posts/latest/?limit=4')
        setPosts(res.data.data ?? [])
      } catch (error) {
        console.error('Failed to fetch news:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLatest()
  }, [])

  if (loading) {
    return (
      <section className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-orange-500" size={36} />
      </section>
    )
  }

  if (posts.length === 0) return null  

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">
              Latest Updates
            </h2>
            <h1 className="text-4xl font-extrabold text-[#1a2b4c]">
              News & Events
            </h1>
          </div>
          <button
            onClick={() => navigate('/news')}
            className="text-orange-600 font-bold flex items-center gap-2 hover:gap-3 transition-all text-sm"
          >
            View All <ArrowRight size={18} />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 group cursor-pointer"
              onClick={() => post.external_link
                ? window.open(post.external_link, '_blank')
                : null
              }
            >
              {/* Thumbnail */}
              <div className="relative h-44 overflow-hidden">
                {post.thumbnail_url ? (
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">No image</span>
                  </div>
                )}
                {/* Category badge */}
                <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  CATEGORY_STYLES[post.category] || 'bg-slate-100 text-slate-600'
                }`}>
                  {post.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-[#1a2b4c] text-sm leading-snug line-clamp-2 mb-2">
                  {post.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar size={12} />
                  {post.category === 'event' && post.event_date
                    ? new Date(post.event_date).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })
                    : new Date(post.created_at).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })
                  }
                </div>
                {post.author && (
                  <p className="text-xs text-slate-400 mt-1">By {post.author}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default NewsEvents