import React, { useEffect, useState, useMemo } from 'react'
import { ChevronDown, Search, Loader2, MessageCircle, ArrowRight } from 'lucide-react'
import api from '../api/axios'
import { Link } from 'react-router-dom'

export default function FAQ() {
  const [faqs, setFaqs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [openId, setOpenId]     = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    api.get('/faq/faqs/')
      .then(res => setFaqs(res.data?.results ?? res.data?.data ?? res.data ?? []))
      .catch(() => setError('Failed to load FAQs.'))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(faqs.map(f => f.category).filter(Boolean))]
    return cats
  }, [faqs])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return faqs.filter(f => {
      const matchSearch = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      const matchCat    = activeCategory === 'All' || f.category === activeCategory
      return matchSearch && matchCat
    })
  }, [faqs, search, activeCategory])

  // Group by category for display
  const grouped = useMemo(() => {
    if (activeCategory !== 'All' || search) return { '': filtered }
    return filtered.reduce((acc, f) => {
      const cat = f.category || 'General'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(f)
      return acc
    }, {})
  }, [filtered, activeCategory, search])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 size={28} className="animate-spin text-orange-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-[#1a2b4c] py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="max-w-3xl mx-auto relative text-center">
          <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">Support</p>
          <h1 className="text-5xl font-black text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-slate-400 text-sm mb-10">Find answers to common questions about admissions, programmes, fees and campus life</p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveCategory('All') }}
              placeholder="Search questions…"
              className="w-full pl-11 pr-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-orange-500/60 focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => { setActiveCategory(cat); setSearch('') }}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeCategory === cat
                    ? 'bg-[#1a2b4c] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAQ content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {filtered.length === 0 && !error && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-sm mb-2">No results for "<strong>{search}</strong>"</p>
            <button onClick={() => setSearch('')} className="text-orange-500 text-sm font-bold hover:underline">
              Clear search
            </button>
          </div>
        )}

        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-12">
            {group && (
              <h2 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-6 pb-3 border-b border-slate-100">
                {group}
              </h2>
            )}
            <div className="space-y-3">
              {items.map((faq) => {
                const id = faq.id ?? faq._id
                const isOpen = openId === id
                return (
                  <div key={id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen ? 'border-orange-200 bg-orange-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}>
                    <button
                      onClick={() => setOpenId(isOpen ? null : id)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
                      <span className={`text-sm font-bold leading-snug ${isOpen ? 'text-orange-600' : 'text-[#1a2b4c]'}`}>
                        {faq.question}
                      </span>
                      <ChevronDown size={16}
                        className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : 'text-slate-400'}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                      <p className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-orange-100 pt-4">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Still need help */}
        {!loading && filtered.length > 0 && (
          <div className="mt-16 bg-[#1a2b4c] rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-black text-xl mb-1">Still have questions?</h3>
              <p className="text-slate-400 text-sm">Our team and AI assistant are ready to help</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link to="/contact"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all">
                Contact Us <ArrowRight size={14} />
              </Link>
              <Link to="/"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all">
                <MessageCircle size={14} /> Ask the AI
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}