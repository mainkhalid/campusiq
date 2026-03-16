import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Save, ListPlus, MapPin, GraduationCap, BookOpen,
  Eye, Edit2, X, RefreshCw, Search, Loader2, Download, Check,
  Globe, ChevronDown, ChevronUp, DollarSign, Clock, Code2,
  Building2, Users, Target, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';

const initialState = {
  name: '', level: 'Degree', school: 'ict', code: '',
  mean_grade: '', campuses: '', modes: 'Full time, Part time, E-Learning',
  description: '', careers: [''], goal: '',
  fee_per_semester: '', semesters: '', duration_years: '',
};

const SCHOOL_LABELS = {
  ict:       'School of ICT, Media & Engineering',
  business:  'School of Business & Economics',
  law:       'School of Law',
  health:    'School of Health Sciences',
  education: 'School of Education, Arts & Social Science',
};

const LEVEL_TABS = ['All', 'Doctorate', 'Masters', 'Degree', 'Diploma', 'Certificate'];

const LEVEL_COLORS = {
  Doctorate:   'bg-purple-100 text-purple-700',
  Masters:     'bg-blue-100 text-blue-700',
  Degree:      'bg-emerald-100 text-emerald-700',
  Diploma:     'bg-amber-100 text-amber-700',
  Certificate: 'bg-rose-100 text-rose-700',
};

const inputCls = 'w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] outline-none transition-colors';

// ── Expanded row detail ───────────────────────────────────
function ProgrammeDetail({ programme, onEdit, onDelete }) {
  return (
    <div className="bg-slate-50 border-t border-slate-100 px-6 py-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Column 1 — Fees & Duration */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fees & Duration</p>
          <div className="space-y-2">
            {programme.fee_per_semester > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign size={14} className="text-emerald-500 flex-shrink-0" />
                <span className="text-slate-600">KES <strong>{Number(programme.fee_per_semester).toLocaleString()}</strong>/semester</span>
              </div>
            )}
            {programme.semesters > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-blue-500 flex-shrink-0" />
                <span className="text-slate-600"><strong>{programme.semesters}</strong> semesters</span>
              </div>
            )}
            {programme.duration_years > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-600"><strong>{programme.duration_years}</strong> year{programme.duration_years !== 1 ? 's' : ''}</span>
              </div>
            )}
            {programme.mean_grade && (
              <div className="flex items-center gap-2 text-sm">
                <Target size={14} className="text-orange-500 flex-shrink-0" />
                <span className="text-slate-600">Entry: <strong>{programme.mean_grade}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2 — Delivery */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery</p>
          <div className="space-y-2">
            {programme.campuses && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-600">{programme.campuses}</span>
              </div>
            )}
            {programme.modes && (
              <div className="flex items-start gap-2 text-sm">
                <Building2 size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-600">{programme.modes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3 — Careers */}
        {programme.careers?.length > 0 && programme.careers[0] && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Career Paths</p>
            <ul className="space-y-1">
              {programme.careers.slice(0, 5).map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <Briefcase size={12} className="text-slate-300 flex-shrink-0 mt-1" />
                  {c}
                </li>
              ))}
              {programme.careers.length > 5 && (
                <li className="text-xs text-slate-400">+{programme.careers.length - 5} more</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Description & Goal */}
      {(programme.description || programme.goal) && (
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          {programme.description && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
              <p className="text-sm text-slate-600 line-clamp-4">{programme.description}</p>
            </div>
          )}
          {programme.goal && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Programme Goal</p>
              <p className="text-sm text-slate-600 line-clamp-4">{programme.goal}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-2">
        <button onClick={() => onEdit(programme)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#1a2b4c] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Edit2 size={14} /> Edit
        </button>
        <button onClick={() => onDelete(programme.id)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}

// ── Programme row ─────────────────────────────────────────
function ProgrammeRow({ programme, onEdit, onDelete, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer ${expanded ? 'bg-slate-50' : ''}`}
        onClick={() => setExpanded(!expanded)}>
        <td className="p-4 text-xs font-mono text-slate-300">#{programme.id}</td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{programme.name}</span>
            {programme.code && (
              <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{programme.code}</span>
            )}
          </div>
        </td>
        <td className="p-4">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[programme.level] || 'bg-slate-100 text-slate-600'}`}>
            {programme.level}
          </span>
        </td>
        <td className="p-4 text-sm text-slate-500 hidden md:table-cell">
          {SCHOOL_LABELS[programme.school] || programme.school}
        </td>
        <td className="p-4 text-sm text-slate-600 hidden lg:table-cell">
          {programme.fee_per_semester > 0
            ? <span className="font-semibold text-emerald-600">KES {Number(programme.fee_per_semester).toLocaleString()}</span>
            : <span className="text-slate-300">—</span>
          }
        </td>
        <td className="p-4 text-sm text-slate-500 hidden lg:table-cell">
          {programme.semesters > 0 ? `${programme.semesters} sem` : '—'}
        </td>
        <td className="p-4 text-right">
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="p-0">
            <ProgrammeDetail programme={programme} onEdit={onEdit} onDelete={onDelete} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────
const Programmes = () => {
  const [loading, setLoading]               = useState(false);
  const [courseData, setCourseData]         = useState(initialState);
  const [programmes, setProgrammes]         = useState([]);
  const [fetching, setFetching]             = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [searchTerm, setSearchTerm]         = useState('');
  const [showForm, setShowForm]             = useState(false);
  const [isPreview, setIsPreview]           = useState(false);
  const [activeTab, setActiveTab]           = useState('All');

  // Import state
  const [showImport, setShowImport]         = useState(false);
  const [importing, setImporting]           = useState(false);
  const [confirming, setConfirming]         = useState(false);
  const [importResults, setImportResults]   = useState([]);
  const [selectedImports, setSelectedImports] = useState(new Set());
  const [importDone, setImportDone]         = useState(null);

  useEffect(() => { fetchProgrammes(); }, []);

  const fetchProgrammes = async () => {
    setFetching(true);
    try {
      const res = await api.get('/programmes/programmes/');
      setProgrammes(res.data.results ?? res.data);
    } catch { toast.error('Failed to fetch programmes'); }
    finally { setFetching(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({ ...prev, [name]: value }));
  };

  const handleCareerChange = (index, value) => {
    const updated = [...courseData.careers];
    updated[index] = value;
    setCourseData(prev => ({ ...prev, careers: updated }));
  };

  const handleEdit = (programme) => {
    setCourseData({
      name:            programme.name        || '',
      level:           programme.level       || 'Degree',
      school:          programme.school      || 'ict',
      code:            programme.code        || '',
      mean_grade:      programme.mean_grade  || '',
      campuses:        programme.campuses    || '',
      modes:           programme.modes       || 'Full time, Part time, E-Learning',
      description:     programme.description || '',
      careers:         programme.careers?.length > 0 ? programme.careers : [''],
      goal:            programme.goal        || '',
      fee_per_semester: programme.fee_per_semester || '',
      semesters:       programme.semesters   || '',
      duration_years:  programme.duration_years || '',
    });
    setEditingId(programme.id);
    setShowForm(true);
    setIsPreview(false);
    setShowImport(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setCourseData(initialState);
    setEditingId(null);
    setShowForm(false);
    setIsPreview(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this programme?')) return;
    try {
      await api.delete(`/programmes/programmes/${id}/`);
      toast.success('Programme deleted');
      fetchProgrammes();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...courseData,
      code:     courseData.code || null,
      careers:  courseData.careers.filter(c => c.trim() !== ''),
      school:   courseData.school.toLowerCase().trim(),
    };
    try {
      if (editingId) {
        await api.put(`/programmes/programmes/${editingId}/`, payload);
        toast.success('Programme updated!');
      } else {
        await api.post('/programmes/programmes/', payload);
        toast.success('Programme created!');
      }
      handleCancelEdit();
      fetchProgrammes();
    } catch (error) {
      const data = error.response?.data;
      let msg = 'Failed to save programme';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else {
          const f = Object.keys(data)[0];
          const e = data[f];
          msg = `${f}: ${Array.isArray(e) ? e[0] : e}`;
        }
      }
      toast.error(msg);
    } finally { setLoading(false); }
  };

  // Import handlers
  const handleExtract = async () => {
    setImporting(true);
    setImportResults([]);
    setSelectedImports(new Set());
    setImportDone(null);
    try {
      const res = await api.post('/programmes/import-from-chunks/', { action: 'extract' });
      const progs = res.data.programmes || [];
      setImportResults(progs);
      setSelectedImports(new Set(progs.map((_, i) => i).filter(i => !progs[i].already_exists)));
      if (progs.length === 0) toast.info('No programmes found.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Extraction failed');
    } finally { setImporting(false); }
  };

  const handleConfirmImport = async () => {
    const toImport = importResults.filter((_, i) => selectedImports.has(i));
    if (!toImport.length) { toast.warning('Select at least one programme'); return; }
    setConfirming(true);
    try {
      const res = await api.post('/programmes/import-from-chunks/', { action: 'confirm', programmes: toImport });
      setImportDone(res.data);
      toast.success(`Imported ${res.data.saved} programmes!`);
      fetchProgrammes();
      setImportResults([]);
      setSelectedImports(new Set());
    } catch { toast.error('Import failed'); }
    finally { setConfirming(false); }
  };

  const updateImportField = (idx, field, value) =>
    setImportResults(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));

  // Filtering
  const filtered = programmes.filter(p => {
    const matchTab    = activeTab === 'All' || p.level === activeTab;
    const matchSearch = !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.school?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTab && matchSearch;
  });

  // Tab counts
  const tabCounts = LEVEL_TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'All'
      ? programmes.length
      : programmes.filter(p => p.level === tab).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#1a2b4c]">Programmes</h1>
            <p className="text-slate-400 text-sm mt-0.5">{programmes.length} programmes across all levels</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!showForm && (
              <button onClick={() => { setShowForm(true); setShowImport(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a2b4c] text-white rounded-lg font-semibold hover:bg-slate-800 transition-all text-sm">
                <Plus size={16} /> Add
              </button>
            )}
            <button onClick={() => { setShowImport(!showImport); setShowForm(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all border text-sm ${
                showImport ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
              }`}>
              <Globe size={16} /> Import
            </button>
            <button onClick={fetchProgrammes} disabled={fetching}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 text-sm">
              <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Import Panel ─────────────────────────────────── */}
        {showImport && (
          <div className="mb-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                  <Globe size={16} className="text-emerald-600" /> Import from Zetech Website
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scrapes the official tuition fees page — level and school are detected from page structure, no guessing.
                </p>
              </div>
              <button onClick={() => setShowImport(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={15} />
              </button>
            </div>

            <div className="p-6">
              {importResults.length === 0 && !importDone && (
                <div className="text-center py-10">
                  <Globe size={36} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 text-sm mb-5">
                    Fetches live data from zetech.ac.ke/academics/tuition-fees
                  </p>
                  <button onClick={handleExtract} disabled={importing}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all">
                    {importing
                      ? <><Loader2 size={15} className="animate-spin" /> Fetching...</>
                      : <><Download size={15} /> Fetch Programmes</>}
                  </button>
                </div>
              )}

              {importDone && (
                <div className="text-center py-8">
                  <Check size={36} className="mx-auto text-emerald-500 mb-3" />
                  <p className="font-bold text-slate-800">Import Complete</p>
                  <p className="text-sm text-slate-400 mt-1">{importDone.saved} saved · {importDone.skipped} skipped</p>
                  {importDone.errors?.length > 0 && (
                    <div className="mt-3 text-xs text-red-500 space-y-1">
                      {importDone.errors.map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                  )}
                  <button onClick={() => { setImportDone(null); setShowImport(false); }}
                    className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200">
                    Done
                  </button>
                </div>
              )}

              {importResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-600">
                      <span className="text-emerald-600 font-bold">{importResults.filter(p => !p.already_exists).length} new</span>
                      {' · '}
                      <span className="text-slate-400">{importResults.filter(p => p.already_exists).length} already in DB</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedImports(new Set(importResults.map((_, i) => i).filter(i => !importResults[i].already_exists)))}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold">
                        Select New
                      </button>
                      <button onClick={() => setSelectedImports(new Set())}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold">
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-10"></th>
                          <th className="p-3 text-left font-bold text-slate-600 text-xs uppercase">Programme</th>
                          <th className="p-3 text-left font-bold text-slate-600 text-xs uppercase">Level</th>
                          <th className="p-3 text-left font-bold text-slate-600 text-xs uppercase">School</th>
                          <th className="p-3 text-left font-bold text-slate-600 text-xs uppercase">Fee/Sem</th>
                          <th className="p-3 text-left font-bold text-slate-600 text-xs uppercase">Sems</th>
                          <th className="p-3 text-left font-bold text-slate-600 text-xs uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                        {importResults.map((prog, idx) => (
                          <tr key={idx} className={`${prog.already_exists ? 'opacity-50' : ''} hover:bg-slate-50`}>
                            <td className="p-3">
                              <input type="checkbox" checked={selectedImports.has(idx)}
                                onChange={() => setSelectedImports(prev => {
                                  const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n;
                                })}
                                className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800 text-xs">{prog.name}</span>
                              {prog.code && <span className="ml-1.5 text-[10px] font-mono text-slate-400">({prog.code})</span>}
                            </td>
                            <td className="p-3">
                              <select value={prog.level} onChange={e => updateImportField(idx, 'level', e.target.value)}
                                className="text-xs border border-slate-200 rounded px-2 py-1">
                                {['Certificate','Diploma','Degree','Masters','Doctorate'].map(l => <option key={l}>{l}</option>)}
                              </select>
                            </td>
                            <td className="p-3">
                              <select value={prog.school} onChange={e => updateImportField(idx, 'school', e.target.value)}
                                className="text-xs border border-slate-200 rounded px-2 py-1">
                                {Object.entries(SCHOOL_LABELS).map(([v, l]) => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </td>
                            <td className="p-3 text-xs text-emerald-600 font-semibold">
                              {prog.fee_per_semester > 0 ? `KES ${Number(prog.fee_per_semester).toLocaleString()}` : '—'}
                            </td>
                            <td className="p-3 text-xs text-slate-500">{prog.semesters || '—'}</td>
                            <td className="p-3">
                              {prog.already_exists
                                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Exists</span>
                                : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">New</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-slate-400">{selectedImports.size} selected</p>
                    <div className="flex gap-2">
                      <button onClick={handleExtract} disabled={importing}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">
                        Re-scan
                      </button>
                      <button onClick={handleConfirmImport} disabled={confirming || selectedImports.size === 0}
                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all">
                        {confirming ? <><Loader2 size={14} className="animate-spin" /> Importing...</> : <><Check size={14} /> Import {selectedImports.size}</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Add/Edit Form ─────────────────────────────────── */}
        {showForm && (
          <div className="mb-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-base">
                {editingId ? 'Edit Programme' : 'Add New Programme'}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setIsPreview(!isPreview)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${isPreview ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <Eye size={14} /> {isPreview ? 'Edit' : 'Preview'}
                </button>
                <button onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200">
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>

            {isPreview ? (
              <div className="p-8">
                <div className="flex items-center gap-3 text-[#1a2b4c] font-bold mb-4">
                  <span className="uppercase underline tracking-tight">{courseData.name || 'COURSE NAME'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_COLORS[courseData.level]}`}>{courseData.level}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Mean Grade', value: courseData.mean_grade },
                    { label: 'Campuses', value: courseData.campuses },
                    { label: 'Modes', value: courseData.modes },
                    { label: 'Fee/Semester', value: courseData.fee_per_semester ? `KES ${Number(courseData.fee_per_semester).toLocaleString()}` : '' },
                  ].map(({ label, value }) => value && (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                      <p className="text-sm text-slate-700 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                {courseData.description && <p className="text-sm text-slate-600 mb-4">{courseData.description}</p>}
                {courseData.goal && <p className="text-sm text-slate-500 italic">{courseData.goal}</p>}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Programme Code</label>
                    <input name="code" value={courseData.code} onChange={handleChange}
                      className={inputCls} placeholder="e.g. DSE, BCom" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Study Level *</label>
                    <select name="level" value={courseData.level} onChange={handleChange} className={inputCls} required>
                      {['Certificate','Diploma','Degree','Masters','Doctorate','Professional Certification'].map(l => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">School *</label>
                    <select name="school" value={courseData.school} onChange={handleChange} className={inputCls} required>
                      {Object.entries(SCHOOL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Course name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Course Name *</label>
                  <input name="name" value={courseData.name} onChange={handleChange}
                    className={inputCls} placeholder="e.g. DIPLOMA IN SOFTWARE ENGINEERING" required />
                </div>

                {/* Fees & Duration */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Fee / Semester (KES)</label>
                    <input name="fee_per_semester" type="number" value={courseData.fee_per_semester}
                      onChange={handleChange} className={inputCls} placeholder="54650" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">No. of Semesters</label>
                    <input name="semesters" type="number" value={courseData.semesters}
                      onChange={handleChange} className={inputCls} placeholder="8" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Duration (Years)</label>
                    <input name="duration_years" type="number" value={courseData.duration_years}
                      onChange={handleChange} className={inputCls} placeholder="4" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Mean Grade</label>
                    <input name="mean_grade" value={courseData.mean_grade} onChange={handleChange}
                      className={inputCls} placeholder="C+ (Plus)" />
                  </div>
                </div>

                {/* Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Campuses</label>
                    <input name="campuses" value={courseData.campuses} onChange={handleChange}
                      className={inputCls} placeholder="Ruiru, Nairobi" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Modes of Study</label>
                    <input name="modes" value={courseData.modes} onChange={handleChange} className={inputCls} />
                  </div>
                </div>

                {/* Description & Goal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                    <textarea name="description" value={courseData.description} onChange={handleChange}
                      rows={4} className={inputCls} placeholder="Programme introduction..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Programme Goal</label>
                    <textarea name="goal" value={courseData.goal} onChange={handleChange}
                      rows={4} className={inputCls} placeholder="Overall goal of this programme..." />
                  </div>
                </div>

                {/* Careers */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Career Opportunities</label>
                  {courseData.careers.map((career, index) => (
                    <div key={index} className="flex gap-2">
                      <input value={career} onChange={e => handleCareerChange(index, e.target.value)}
                        className={inputCls} placeholder={`Career ${index + 1}`} />
                      {courseData.careers.length > 1 && (
                        <button type="button" onClick={() => setCourseData(p => ({ ...p, careers: p.careers.filter((_, i) => i !== index) }))}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setCourseData(p => ({ ...p, careers: [...p.careers, ''] }))}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#1a2b4c] hover:text-slate-600">
                    <ListPlus size={15} /> Add Career
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button type="button" onClick={handleCancelEdit}
                    className="px-5 py-2.5 rounded-lg font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 bg-[#1a2b4c] hover:bg-slate-800 text-white disabled:opacity-50 text-sm">
                    {loading ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> {editingId ? 'Update' : 'Save'}</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── Programmes Table ──────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Tabs + Search */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              {/* Level tabs */}
              <div className="flex gap-1 flex-wrap">
                {LEVEL_TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab
                        ? 'bg-[#1a2b4c] text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}>
                    {tab}
                    {tabCounts[tab] > 0 && (
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>{tabCounts[tab]}</span>
                    )}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative w-full md:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1a2b4c]/20 focus:border-[#1a2b4c] outline-none" />
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw size={22} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <BookOpen size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm">{searchTerm ? 'No programmes match your search.' : 'No programmes in this category.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase w-12">#</th>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">Programme</th>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">Level</th>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase hidden md:table-cell">School</th>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase hidden lg:table-cell">Fee/Sem</th>
                    <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase hidden lg:table-cell">Sems</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((programme, i) => (
                    <ProgrammeRow key={programme.id} programme={programme}
                      onEdit={handleEdit} onDelete={handleDelete} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-right">
              Showing {filtered.length} of {programmes.length} programmes · Click any row to expand
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Programmes;