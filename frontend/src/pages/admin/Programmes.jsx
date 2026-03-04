import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Save, ListPlus,
  MapPin, GraduationCap, BookOpen, Eye,
  Edit2, X, RefreshCw, Search, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';

const initialState = {
  name: '',
  level: 'Degree',
  school: 'ict',
  mean_grade: '',
  campuses: '',
  modes: 'Full time, Part time, E-Learning',
  description: '',
  careers: [''],
  goal: ''
};

const SCHOOL_LABELS = {
  ict:       'School of ICT, Media and Engineering',
  business:  'School of Business Economics',
  law:       'School of Law',
  health:    'School of Health Sciences',
  education: 'School of Education, Arts & Social Science',
};

const Programmes = () => {
  const [isPreview, setIsPreview]             = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [courseData, setCourseData]           = useState(initialState);
  const [programmes, setProgrammes]           = useState([]);
  const [fetchingProgrammes, setFetchingProgrammes] = useState(false);
  const [editingId, setEditingId]             = useState(null);
  const [searchTerm, setSearchTerm]           = useState('');
  const [showForm, setShowForm]               = useState(false);

  useEffect(() => { fetchProgrammes() }, []);

  // ── Fetch ───────────────────────────────────────────────
  const fetchProgrammes = async () => {
    setFetchingProgrammes(true);
    try {
      const res = await api.get('/programmes/programmes/');
      // DRF paginated: { count, results: [] }
      setProgrammes(res.data.results ?? res.data);
    } catch {
      toast.error('Failed to fetch programmes');
    } finally {
      setFetchingProgrammes(false);
    }
  };

  // ── Form handlers ────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({ ...prev, [name]: value }));
  };

  const handleCareerChange = (index, value) => {
    const updated = [...courseData.careers];
    updated[index] = value;
    setCourseData(prev => ({ ...prev, careers: updated }));
  };

  const addCareerField = () => {
    setCourseData(prev => ({ ...prev, careers: [...prev.careers, ''] }));
  };

  const removeCareerField = (index) => {
    setCourseData(prev => ({
      ...prev,
      careers: prev.careers.filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (programme) => {
    setCourseData({
      name:        programme.name        || '',
      level:       programme.level       || 'Degree',
      school:      programme.school      || 'ict',
      mean_grade:  programme.mean_grade  || '',
      campuses:    programme.campuses    || '',
      modes:       programme.modes       || 'Full time, Part time, E-Learning',
      description: programme.description || '',
      careers:     programme.careers?.length > 0 ? programme.careers : [''],
      goal:        programme.goal        || ''
    });
    setEditingId(programme.id);   // ← Django auto pk, not course_code
    setShowForm(true);
    setIsPreview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setCourseData(initialState);
    setEditingId(null);
    setShowForm(false);
    setIsPreview(false);
  };

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async (programmeId) => {
    if (!window.confirm('Are you sure you want to delete this programme?')) return;
    try {
      await api.delete(`/programmes/programmes/${programmeId}/`);
      toast.success('Programme deleted successfully!');
      fetchProgrammes();
    } catch {
      toast.error('Failed to delete programme');
    }
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Clean payload — filter empty careers, send snake_case fields
    const payload = {
      ...courseData,
      careers: courseData.careers.filter(c => c.trim() !== '')
    };

    try {
      if (editingId) {
        await api.put(`/programmes/programmes/${editingId}/`, payload);
        toast.success('Programme updated successfully!');
      } else {
        await api.post('/programmes/programmes/', payload);
        toast.success('Programme created successfully!');
      }
      handleCancelEdit();
      fetchProgrammes();
    } catch (error) {
      const msg = error.response?.data?.detail
        || error.response?.data?.name?.[0]
        || 'Failed to save programme';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Filter ───────────────────────────────────────────────
  const filteredProgrammes = programmes.filter(prog =>
    prog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prog.school?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Programme Administrator</h1>
            <p className="text-slate-500 text-sm">Add, edit, or update programme details</p>
          </div>
          <div className="flex gap-2">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
              >
                <Plus size={18} /> Add New Programme
              </button>
            )}
            <button
              onClick={fetchProgrammes}
              disabled={fetchingProgrammes}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={fetchingProgrammes ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Programme' : 'Create New Programme'}
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreview(!isPreview)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    isPreview
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <Eye size={18} /> {isPreview ? 'Back to Edit' : 'Live Preview'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all"
                >
                  <X size={18} /> Cancel
                </button>
              </div>
            </div>

            {/* ── Preview ── */}
            {isPreview ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 text-blue-800 font-bold mb-2">
                  <Plus size={14} />
                  <span className="uppercase underline tracking-tight">
                    {courseData.name || 'COURSE NAME PREVIEW'}
                  </span>
                </div>
                <div className="ml-7 space-y-4 text-[13px] text-slate-700 leading-relaxed">
                  <p><span className="font-bold">MEAN GRADE:</span> {courseData.mean_grade || 'Not specified'}</p>
                  <p><span className="font-bold">CAMPUSES OFFERED:</span> {courseData.campuses || 'Not specified'}</p>
                  <p><span className="font-bold">MODES OF STUDY:</span> {courseData.modes}</p>
                  <div>
                    <p className="font-bold uppercase mb-1">PROGRAM DESCRIPTION:</p>
                    <p className="font-semibold italic">Introduction</p>
                    <p className="whitespace-pre-wrap">{courseData.description || 'No description provided'}</p>
                  </div>
                  {courseData.careers.some(c => c.trim()) && (
                    <div>
                      <p className="font-semibold italic">Career Opportunities</p>
                      <ol className="list-decimal ml-10 mt-1">
                        {courseData.careers.map((c, i) => c && <li key={i}>{c}</li>)}
                      </ol>
                    </div>
                  )}
                  {courseData.goal && (
                    <div>
                      <p className="font-bold uppercase mb-1">PROGRAM GOAL:</p>
                      <p className="whitespace-pre-wrap">{courseData.goal}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Edit Form ── */
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* General Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                      <BookOpen size={18} className="text-blue-500" /> General Information
                    </h2>
                  </div>

                  {/* Course Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Course Name *
                    </label>
                    <input
                      name="name"
                      value={courseData.name}
                      onChange={handleChange}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. DIPLOMA IN SOFTWARE ENGINEERING"
                      required
                    />
                  </div>

                  {/* Level */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Study Level *
                    </label>
                    <select
                      name="level"
                      value={courseData.level}
                      onChange={handleChange}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="Certificate">Certificate</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Degree">Degree</option>
                      <option value="Masters">Masters</option>
                      <option value="Doctorate">Doctorate</option>
                      <option value="Professional Certification">Professional Certification</option>
                    </select>
                  </div>

                  {/* School */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      School *
                    </label>
                    <select
                      name="school"
                      value={courseData.school}
                      onChange={handleChange}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      {Object.entries(SCHOOL_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Mean Grade */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Mean Grade Requirements
                    </label>
                    <input
                      name="mean_grade"
                      value={courseData.mean_grade}
                      onChange={handleChange}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. C- (Minus) | Mathematics D+"
                    />
                  </div>
                </div>

                {/* Delivery & Campuses */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <MapPin size={18} className="text-red-500" /> Delivery & Campuses
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Campuses Offered
                      </label>
                      <input
                        name="campuses"
                        value={courseData.campuses}
                        onChange={handleChange}
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Ruiru, Town Campus, Nairobi"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Modes of Study
                      </label>
                      <input
                        name="modes"
                        value={courseData.modes}
                        onChange={handleChange}
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Curriculum & Career */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap size={18} className="text-orange-500" /> Programme Curriculum & Career
                  </h2>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Program Description
                    </label>
                    <textarea
                      name="description"
                      value={courseData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter a detailed introduction about the programme..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block">
                      Career Opportunities
                    </label>
                    {courseData.careers.map((career, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          value={career}
                          onChange={(e) => handleCareerChange(index, e.target.value)}
                          className="flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder={`Career opportunity ${index + 1}`}
                        />
                        {courseData.careers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCareerField(index)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCareerField}
                      className="mt-2 flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                    >
                      <ListPlus size={16} /> Add Another Career
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Program Goal
                    </label>
                    <textarea
                      name="goal"
                      value={courseData.goal}
                      onChange={handleChange}
                      rows={3}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="What is the overall goal of this programme?"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4 gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-3 rounded-lg font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg bg-[#1a2b4c] hover:bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
                      : <><Save size={18} /> {editingId ? 'Update Programme' : 'Save Programme'}</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Programmes Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">All Programmes</h2>
                {!fetchingProgrammes && (
                  <p className="text-sm text-slate-400">
                    {filteredProgrammes.length} programme{filteredProgrammes.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="relative w-full md:w-64">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {fetchingProgrammes ? (
            <div className="p-8 text-center text-slate-500">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              Loading programmes...
            </div>
          ) : filteredProgrammes.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {searchTerm
                ? 'No programmes found matching your search.'
                : 'No programmes yet. Add your first programme above!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-700 text-sm">#</th>
                    <th className="text-left p-4 font-bold text-slate-700 text-sm">Programme Name</th>
                    <th className="text-left p-4 font-bold text-slate-700 text-sm">Level</th>
                    <th className="text-left p-4 font-bold text-slate-700 text-sm">School</th>
                    <th className="text-right p-4 font-bold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProgrammes.map((programme) => (
                    <tr
                      key={programme.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 text-sm font-mono text-slate-400">
                        #{programme.id}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-900">
                        {programme.name}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {programme.level}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {SCHOOL_LABELS[programme.school] || programme.school}
                      </td>
                      <td className="p-4 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(programme)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit programme"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(programme.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete programme"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Programmes;