// src/pages/Research.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import api from '../api/axios'
import ScholarshipCard from '../components/ScholarshipCard'

const Research = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)
  const [scholarshipsLoading, setScholarshipsLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Django URL — published projects only (public endpoint)
        const response = await api.get('/research/projects/?published=true')
        // DRF paginated response
        setProjects(response.data.results ?? response.data)
      } catch (error) {
        console.error('Error fetching research:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        // Django active scholarships custom action endpoint
        const response = await api.get('/scholarships/scholarships/active/')
        setScholarships(response.data.data ?? [])
      } catch (error) {
        console.error('Error fetching scholarships:', error)
        try {
          // Fallback to filtered list
          const fallback = await api.get(
            '/scholarships/scholarships/?published=true'
          )
          setScholarships(fallback.data.results ?? [])
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
        }
      } finally {
        setScholarshipsLoading(false)
      }
    }
    fetchScholarships()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <section
        className="relative py-16 text-white bg-cover bg-center"
        style={{ backgroundImage: "url('https://cdn.tuko.co.ke/images/720/18d0a87c71bce9fb.webp?v=1')" }}
      >
        <div className="absolute inset-0 bg-[#1a2b4c]/85" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold mb-4">Research & Innovation</h1>
          <p className="text-slate-300 max-w-2xl mx-auto italic">
            "Advancing knowledge through technology and community-centered research."
          </p>
        </div>
      </section>

      {/* Research Projects */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">
                Ongoing Work
              </h2>
              <h1 className="text-4xl font-extrabold text-[#1a2b4c]">
                Ongoing Research & Innovations
              </h1>
            </div>
            <button
              onClick={() => navigate('/research-projects')}
              className="text-orange-600 font-bold flex items-center gap-2 hover:gap-3 transition-all"
            >
              View All Projects <ArrowRight size={20} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">
                No active research projects at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {projects.slice(0, 3).map((project) => (
                // ← id not _id
                <div
                  key={project.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-slate-100 group"
                >
                  <div className="relative h-48">
                    <img
                      // Django returns full URL via thumbnail_url field
                      // (set up in ResearchProjectSerializer)
                      src={project.thumbnail_url || '/placeholder.jpg'}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                      {project.status}
                    </div>
                  </div>
                  <div className="p-6">
                    <span className="text-orange-600 text-xs font-bold uppercase">
                      {project.department}
                    </span>
                    <h3 className="text-xl font-bold text-[#1a2b4c] mt-2 mb-3 line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                      {project.abstract}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                          {project.lead?.charAt(0) || 'R'}
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {project.lead}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/research/${project.id}`)}
                        className="text-[#1a2b4c] font-bold text-sm hover:text-orange-600"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Scholarships */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-2">
              Funding Opportunities
            </h2>
            <h1 className="text-4xl font-extrabold text-[#1a2b4c] mb-4">
              Scholarships & Grants
            </h1>
          </div>

          {scholarshipsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-rose-500" size={40} />
            </div>
          ) : scholarships.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">
                No active scholarships available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {scholarships.slice(0, 3).map((scholarship) => (
                <ScholarshipCard
                  key={scholarship.id}
                  scholarship={scholarship}
                />
              ))}
            </div>
          )}

          {scholarships.length > 3 && (
            <div className="text-center mt-12">
              <button
                onClick={() => navigate('/scholarships')}
                className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all inline-flex items-center gap-2"
              >
                View All Scholarships <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Research