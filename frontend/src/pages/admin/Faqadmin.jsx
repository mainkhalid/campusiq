import React, { useState, useEffect } from 'react';
import {
  Trash2, Edit2, Save, Search,
  HelpCircle, MessageSquare, Eye, Plus, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';

const FAQAdmin = () => {
  const categories = ['Admissions', 'Programs', 'Fees', 'Campus Life', 'Technical'];

  const [isPreview, setIsPreview]     = useState(false);
  const [faqs, setFaqs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editingId, setEditingId]     = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [formData, setFormData] = useState({
    category: 'Admissions',
    question: '',
    answer:   '',
    status:   'draft',
  });

  // ── Fetch ──────────────────────────────────────────────
  const fetchFaqs = async () => {
    setLoading(true);
    try {
      // ✅ Django URL — authenticated users see all FAQs
      const res = await api.get('/faq/faqs/');
      // DRF paginated response
      setFaqs(res.data.results ?? res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  // ── Form handlers ──────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ category: 'Admissions', question: '', answer: '', status: 'draft' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // ✅ Django URL with trailing slash
        await api.put(`/faq/faqs/${editingId}/`, formData);
        toast.success('FAQ updated successfully');
      } else {
        // ✅ Django URL
        await api.post('/faq/faqs/', formData);
        toast.success('FAQ created successfully');
      }
      resetForm();
      fetchFaqs();
    } catch (err) {
      console.error(err);
      toast.error('Error saving FAQ');
    }
  };

  const handleEdit = (faq) => {
    setEditingId(faq.id);   // ✅ Django uses id not _id
    setFormData({
      category: faq.category,
      question: faq.question,
      answer:   faq.answer,
      status:   faq.status,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      // ✅ Django URL with trailing slash
      await api.delete(`/faq/faqs/${id}/`);
      toast.success('FAQ deleted');
      fetchFaqs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete FAQ');
    }
  };

  // ── Filter ─────────────────────────────────────────────
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch   = faq.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || faq.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4c]">FAQ Administrator</h1>
            <p className="text-slate-500 text-sm">
              {faqs.length} total · {faqs.filter(f => f.status === 'published').length} published
            </p>
          </div>
          <div className="flex gap-2">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a2b4c] text-white rounded-lg font-semibold"
              >
                <Plus size={16} /> Add FAQ
              </button>
            )}
            <button
              onClick={fetchFaqs}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border"
            >
              <Eye size={16} /> {isPreview ? 'Edit Mode' : 'Preview'}
            </button>
          </div>
        </div>

        {isPreview ? (
          // ── Preview mode ────────────────────────────────
          <div className="space-y-4">
            {filteredFaqs.map(faq => (
              <div key={faq.id} className="bg-white p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-blue-800 font-bold">
                    <HelpCircle size={16} />
                    {faq.category}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    faq.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {faq.status}
                  </span>
                </div>
                <h3 className="font-bold mb-1">{faq.question}</h3>
                <p className="text-sm text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border mb-6">
                <h2 className="font-bold flex items-center gap-2 mb-4 text-[#1a2b4c]">
                  <MessageSquare size={18} />
                  {editingId ? 'Edit FAQ' : 'Create FAQ'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c]/20 outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c]/20 outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Question *</label>
                  <input
                    name="question"
                    value={formData.question}
                    onChange={handleChange}
                    placeholder="e.g. What are the entry requirements for a Diploma?"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c]/20 outline-none"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Answer *</label>
                  <textarea
                    name="answer"
                    value={formData.answer}
                    onChange={handleChange}
                    placeholder="Provide a clear, helpful answer..."
                    rows={5}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1a2b4c]/20 outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={resetForm}
                    className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit"
                    className="bg-[#1a2b4c] text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-slate-800">
                    <Save size={16} /> {editingId ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            )}

            {/* Search & Filter */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 flex gap-3 border-b items-center">
                <Search size={16} className="text-slate-400 flex-shrink-0" />
                <input
                  placeholder="Search questions..."
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 outline-none text-sm"
                />
                <select
                  onChange={e => setFilterCategory(e.target.value)}
                  className="border rounded px-2 py-1 text-sm outline-none"
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading...</div>
              ) : filteredFaqs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No FAQs found. Create your first one above.
                </div>
              ) : (
                filteredFaqs.map(faq => (
                  <div key={faq.id} className="p-4 flex items-start justify-between border-t gap-4 hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {faq.category}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          faq.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {faq.status}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 truncate">{faq.question}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{faq.answer}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      {/* ✅ uses faq.id not faq._id */}
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FAQAdmin;