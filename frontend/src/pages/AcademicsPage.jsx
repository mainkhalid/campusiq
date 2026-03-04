import React, { useState, useEffect } from 'react'
import { Search, Plus, Minus } from 'lucide-react'
import api from '../api/axios'

const AcademicsPage = () => {
  const [filters, setFilters] = useState({ school: '', search: '' })
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProgrammes = async () => {
      try {
        const res = await api.get('/programmes/programmes/')
        // DRF paginated response: { count, results: [] }
        setCourses(res.data.results ?? res.data)
      } catch (err) {
        setError('Failed to load programmes')
      } finally {
        setLoading(false)
      }
    }
    fetchProgrammes()
  }, [])

  const toggleCourse = (id) => {
    setExpandedCourse((prev) => (prev === id ? null : id))
  }

  const levels = [...new Set(courses.map((course) => course.level))]

  if (loading) return <p className="p-6 text-center">Loading programmes...</p>
  if (error) return <p className="p-6 text-center text-red-600">{error}</p>

  return (
    <div className="min-h-screen bg-white text-[#333]">
      <section className="bg-[#1a2b4c] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">List Of Programs</h1>
          <p className="text-slate-400 text-sm mt-1">Click To Expand A Program</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-10 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search programs..."
            className="w-full border-b border-slate-200 pl-10 py-3 focus:outline-none focus:border-blue-500 transition-colors"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="space-y-10">
          {levels.length === 0 && (
            <p className="text-center text-slate-500">No programmes found</p>
          )}

          {levels.map((level) => {
            const levelCourses = courses.filter(
              (c) =>
                c.level === level &&
                (!filters.search ||
                  c.name.toLowerCase().includes(filters.search.toLowerCase()))
            )
            if (levelCourses.length === 0) return null

            return (
              <div key={level}>
                <h2 className="text-2xl font-serif text-slate-800 border-b border-slate-100 pb-2 mb-6">
                  {level}
                </h2>
                <div className="space-y-4">
                  {levelCourses.map((course) => {
                    // ← id not _id
                    const isExpanded = expandedCourse === course.id
                    return (
                      <div
                        key={course.id}
                        className="border-l-2 border-transparent hover:border-slate-100 transition-all"
                      >
                        <button
                          onClick={() => toggleCourse(course.id)}
                          className="flex items-center gap-3 w-full text-left group py-1"
                        >
                          {isExpanded
                            ? <Minus size={14} className="text-blue-600" />
                            : <Plus size={14} className="text-blue-500 group-hover:text-blue-700" />
                          }
                          <span className={`text-[13px] font-bold tracking-tight uppercase hover:underline ${
                            isExpanded ? 'text-blue-700 underline' : 'text-blue-800'
                          }`}>
                            {course.name}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="ml-7 mt-4 space-y-5 text-[13px] leading-relaxed text-slate-700 max-w-5xl animate-in fade-in slide-in-from-top-2 duration-300">
                            <div>
                              <p className="font-bold uppercase inline">MEAN GRADE: </p>
                              {/* Django uses snake_case: mean_grade not meanGrade */}
                              <span>{course.mean_grade || 'Not specified'}</span>
                            </div>
                            <div>
                              <p className="font-bold uppercase inline">CAMPUSES OFFERED: </p>
                              <span>{course.campuses || 'Not specified'}</span>
                            </div>
                            <div>
                              <p className="font-bold uppercase inline">MODES OF STUDY: </p>
                              <span>{course.modes || 'Not specified'}</span>
                            </div>
                            <div className="space-y-2">
                              <p className="font-bold uppercase">PROGRAM DESCRIPTION:</p>
                              <p className="font-semibold italic">Introduction</p>
                              <p>{course.description || 'No description provided'}</p>
                            </div>
                            {course.careers?.length > 0 && (
                              <div className="space-y-2">
                                <p className="font-semibold italic">Career Opportunities</p>
                                <ol className="list-decimal ml-10 space-y-1">
                                  {course.careers.map((career, i) =>
                                    career && <li key={i}>{career}</li>
                                  )}
                                </ol>
                              </div>
                            )}
                            {course.goal && (
                              <div className="space-y-2 pb-6">
                                <p className="font-bold uppercase">Program Goal</p>
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