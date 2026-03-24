import React, { useState, useEffect } from 'react'
import { Search, Plus, Minus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'

const LEVEL_LABELS = {
  'Masters':     'Postgraduate',
  'Doctorate':   'Doctorate',
  'Degree':      'Degree Courses',
  'Diploma':     'Diploma Courses',
  'Certificate': 'Certificate Courses',
  'TVET':        'TVET Courses',
}

const AcademicsPage = () => {
  const [searchParams]                    = useSearchParams()
  const [search, setSearch]               = useState('')
  const [activeLevel, setActiveLevel]     = useState(searchParams.get('level') || '')
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [courses, setCourses]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)

  useEffect(() => {
    const lvl = searchParams.get('level') || ''
    setActiveLevel(lvl)
    setExpandedCourse(null)
  }, [searchParams])

  useEffect(() => {
    const fetchProgrammes = async () => {
      try {
        const res = await api.get('/programmes/programmes/')
        setCourses(res.data.results ?? res.data)
      } catch {
        setError('Failed to load programmes')
      } finally {
        setLoading(false)
      }
    }
    fetchProgrammes()
  }, [])

  const toggleCourse = (id) => setExpandedCourse(prev => prev === id ? null : id)

  // All distinct levels in the data, ordered
  const LEVEL_ORDER = ['Masters', 'Doctorate', 'Degree', 'Diploma', 'Certificate', 'TVET']
  const availableLevels = LEVEL_ORDER.filter(l => courses.some(c => c.level === l))

  const filteredCourses = courses.filter(c => {
    const matchLevel  = !activeLevel || c.level === activeLevel
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    return matchLevel && matchSearch
  })

  const displayLevels = activeLevel
    ? [activeLevel]
    : availableLevels.filter(l => filteredCourses.some(c => c.level === l))

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-slate-500 animate-pulse">Loading programmes...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-red-500">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white text-[#333]">

      {/* Hero */}
      <section className="bg-[#1a2b4c] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">List Of Programs</h1>
          <p className="text-slate-400 text-sm mt-1">Click a programme to expand details</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Search */}
        <div className="mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search programmes..."
            value={search}
            onChange={e => { setSearch(e.target.value); setExpandedCourse(null) }}
            className="w-full border-b border-slate-200 pl-10 py-3 focus:outline-none focus:border-[#1a2b4c] transition-colors bg-transparent"
          />
        </div>

        {/* Level filter pills */}
        {availableLevels.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => { setActiveLevel(''); setExpandedCourse(null) }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeLevel === ''
                  ? 'bg-[#1a2b4c] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              All
            </button>
            {availableLevels.map(l => (
              <button key={l}
                onClick={() => { setActiveLevel(l); setExpandedCourse(null) }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeLevel === l
                    ? 'bg-[#1a2b4c] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {LEVEL_LABELS[l] || l}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {(search || activeLevel) && (
          <p className="text-xs text-slate-400 mb-6">
            {filteredCourses.length} programme{filteredCourses.length !== 1 ? 's' : ''} found
            {activeLevel && ` in ${LEVEL_LABELS[activeLevel] || activeLevel}`}
            {search && ` matching "${search}"`}
          </p>
        )}

        {/* Programme list grouped by level */}
        <div className="space-y-10">
          {displayLevels.length === 0 && (
            <p className="text-center text-slate-400 py-16">No programmes found</p>
          )}

          {displayLevels.map(level => {
            const levelCourses = filteredCourses.filter(c => c.level === level)
            if (levelCourses.length === 0) return null

            return (
              <div key={level}>
                <h2 className="text-2xl font-serif text-slate-800 border-b border-slate-100 pb-2 mb-6">
                  {LEVEL_LABELS[level] || level}
                  <span className="ml-2 text-sm font-sans text-slate-400 font-normal">
                    ({levelCourses.length})
                  </span>
                </h2>

                <div className="space-y-4">
                  {levelCourses.map(course => {
                    const isExpanded = expandedCourse === course.id
                    return (
                      <div key={course.id}
                        className={`border-l-2 transition-all ${isExpanded ? 'border-[#1a2b4c]' : 'border-transparent hover:border-slate-200'}`}>
                        <button
                          onClick={() => toggleCourse(course.id)}
                          className="flex items-center gap-3 w-full text-left group py-1 px-2"
                        >
                          {isExpanded
                            ? <Minus size={14} className="text-[#1a2b4c] flex-shrink-0" />
                            : <Plus  size={14} className="text-blue-500 group-hover:text-[#1a2b4c] flex-shrink-0" />
                          }
                          <span className={`text-[13px] font-bold tracking-tight uppercase ${
                            isExpanded ? 'text-[#1a2b4c] underline' : 'text-blue-800 hover:underline'
                          }`}>
                            {course.name}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="ml-7 mt-4 space-y-5 text-[13px] leading-relaxed text-slate-700 max-w-5xl pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                              <span className="font-bold uppercase">Mean Grade: </span>
                              <span>{course.mean_grade || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="font-bold uppercase">Campuses: </span>
                              <span>{course.campuses || 'Not specified'}</span>
                            </div>
                            {course.modes && (
                              <div>
                                <span className="font-bold uppercase">Modes of Study: </span>
                                <span>{course.modes}</span>
                              </div>
                            )}
                            {course.description && (
                              <div className="space-y-1">
                                <p className="font-bold uppercase">Programme Description</p>
                                <p>{course.description}</p>
                              </div>
                            )}
                            {course.careers?.length > 0 && (
                              <div className="space-y-2">
                                <p className="font-bold uppercase">Career Opportunities</p>
                                <ol className="list-decimal ml-8 space-y-1">
                                  {course.careers.filter(Boolean).map((career, i) => (
                                    <li key={i}>{career}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            {course.goal && (
                              <div className="space-y-1">
                                <p className="font-bold uppercase">Programme Goal</p>
                                <p>{course.goal}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AcademicsPage