import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import api from '../api/axios'

const FAQ = () => {
  const [faqs, setFaqs] = useState([])
  const [openIndex, setOpenIndex] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        // Django endpoint + only published FAQs for public page
        const res = await api.get('/faq/faqs/?status=published')
        // DRF returns { count, next, previous, results: [] }
        setFaqs(res.data.results ?? res.data)
      } catch (err) {
        console.error(err)
        setError('Failed to load FAQs')
      } finally {
        setLoading(false)
      }
    }
    fetchFaqs()
  }, [])

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  if (loading) {
    return (
      <section className="py-20 text-center">
        <p className="text-gray-500">Loading FAQs...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20 text-center">
        <p className="text-red-500">{error}</p>
      </section>
    )
  }

  return (
    <section className="py-20 bg-[#e6f7f5] min-h-screen font-sans">
      <div className="max-w-6xl mx-auto px-6">

        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-10">
            Frequently Asked Questions
          </h1>
          <div className="relative max-w-md">
            <Search
              className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-transparent border-b-2 border-gray-400 focus:border-black outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {filteredFaqs.map((faq, index) => (
            // ← id not _id
            <div key={faq.id} className="border-b-2 border-black pb-4 self-start">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between text-left group"
              >
                <h3 className="text-lg md:text-xl font-medium text-gray-800 pr-4">
                  {faq.question}
                </h3>
                {openIndex === index
                  ? <ChevronUp size={20} />
                  : <ChevronDown size={20} />
                }
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'max-h-48 mt-4' : 'max-h-0'
              }`}>
                <p className="text-gray-600 text-sm md:text-base">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 italic">No matching questions found.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default FAQ