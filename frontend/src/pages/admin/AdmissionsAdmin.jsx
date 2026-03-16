import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Upload, Calendar, Save,
  Clock, Trash2, FileSpreadsheet, School, MapPin,
  BookOpen, Users, Building2, ChevronDown, ChevronRight,
  AlertTriangle, GraduationCap, Hash, Table2, Search,
  CheckCircle2, X, Wifi
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';



// ── Config ────────────────────────────────────────────────────
const CAMPUS_OPTIONS = [
  { id: 'ruiru',      name: 'Ruiru Campus' },
  { id: 'thika_road', name: 'Thika Road Campus' },
  { id: 'mangu',      name: "Mang'u Campus" },
  { id: 'town',       name: 'Town Campus' },
];

const SCHOOL_OPTIONS = [
  { id: 'all',       name: 'All Schools (Campus-wide)' },
  { id: 'ict',       name: 'School of ICT, Media and Engineering' },
  { id: 'business',  name: 'School of Business and Economics' },
  { id: 'law',       name: 'School of Law' },
  { id: 'health',    name: 'School of Health Sciences' },
  { id: 'education', name: 'School of Education, Arts & Social Science' },
];

const SEMESTER_OPTIONS = [
  { value: 'Jan-April',  label: 'January – April',     tag: 'Semester 1' },
  { value: 'May-Aug',    label: 'May – August',         tag: 'Semester 2' },
  { value: 'Sept-Dec',   label: 'September – December', tag: 'Semester 3' },
];

const DAYS    = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS   = [
  { key: '08:00', label: '08:00 – 11:00', end: '11:00' },
  { key: '11:00', label: '11:00 – 14:00', end: '14:00' },
  { key: '14:00', label: '14:00 – 17:00', end: '17:00' },
  { key: '17:30', label: '17:30 – 20:30', end: '20:30' },
];

const INITIAL = {
  campus: 'ruiru', school: 'all',
  academicYear: '2025/2026', semester: 'Jan-April',
  timetableFile: null, timetableName: '', notes: '',
};

// ── Helpers ───────────────────────────────────────────────────
const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
      {Icon && <Icon size={11} className="text-slate-400" />} {label}
    </label>
    {children}
  </div>
);

const StatBadge = ({ icon: Icon, value, label, color }) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${color}`}>
    <Icon size={16} className="mb-1 opacity-70" />
    <div className="text-xl font-black">{value}</div>
    <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5 opacity-70">{label}</div>
  </div>
);

const Collapsible = ({ trigger, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-semibold text-slate-700">
        {trigger}
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
};

// ── Session cell for the timetable grid ───────────────────────
const SessionCell = ({ session }) => {
  const isOnline = session.room === 'ONLINE';
  return (
    <div className={`rounded-lg p-2.5 border text-xs leading-snug ${
      isOnline
        ? 'bg-sky-50 border-sky-200 text-sky-900'
        : 'bg-indigo-50 border-indigo-200 text-indigo-900'
    }`}>
      <div className="font-black tracking-wide text-[11px]">{session.unit_code}</div>
      <div className="text-[10px] mt-0.5 opacity-80 capitalize leading-tight">{session.unit_title}</div>
      <div className="mt-1.5 flex items-center justify-between gap-1 flex-wrap">
        <span className="text-[10px] font-medium opacity-70 truncate max-w-[90px]">{session.lec_name}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
          isOnline ? 'bg-sky-200 text-sky-800' : 'bg-indigo-200 text-indigo-800'
        }`}>
          {isOnline ? <Wifi size={8} /> : <Building2 size={8} />}
          {session.room}
        </span>
      </div>
    </div>
  );
};

// ── Timetable grid for one programme ─────────────────────────
const TimetableGrid = ({ sessions }) => {
  // Build lookup: day → slot_start → session
  const grid = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      if (!map[s.day]) map[s.day] = {};
      map[s.day][s.start_time] = s;
    });
    return map;
  }, [sessions]);

  // Only show days that have at least one session
  const activeDays = DAYS.filter(d => grid[d] && Object.keys(grid[d]).length > 0);
  // Only show slots that have any session across all days
  const activeSlots = SLOTS.filter(sl => activeDays.some(d => grid[d]?.[sl.key]));

  if (activeDays.length === 0) return (
    <p className="text-sm text-slate-400 text-center py-8">No sessions for this programme.</p>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs min-w-[500px]">
        <thead>
          <tr>
            <th className="w-28 text-left p-2 text-[10px] font-bold text-slate-400 uppercase">Time</th>
            {activeDays.map(d => (
              <th key={d} className="p-2 text-center text-[11px] font-bold text-slate-600 bg-slate-50 rounded-t-lg">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeSlots.map(slot => (
            <tr key={slot.key} className="border-t border-slate-100">
              <td className="p-2 pr-3 align-top">
                <div className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{slot.label}</div>
              </td>
              {activeDays.map(d => (
                <td key={d} className="p-1.5 align-top min-w-[140px]">
                  {grid[d]?.[slot.key]
                    ? <SessionCell session={grid[d][slot.key]} />
                    : <div className="h-full min-h-[40px] rounded-lg bg-slate-50 border border-dashed border-slate-200" />
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Parsed Data Viewer ────────────────────────────────────────
const ParsedDataViewer = ({ sessions, programmes }) => {
  const [search, setSearch]           = useState('');
  const [codeFilter, setCodeFilter]   = useState('');
  const [activeProg, setActiveProg]   = useState(null);

  // Unique programme codes for filter pills
  const progCodes = useMemo(() =>
    [...new Set(sessions.map(s => s.programme_code))].sort()
  , [sessions]);

  // Programmes filtered by code + search
  const filteredProgs = useMemo(() => {
    return programmes.filter(p => {
      const codeOk = !codeFilter || p.startsWith(codeFilter) || p === codeFilter || p.includes(codeFilter);
      const searchOk = !search || p.toLowerCase().includes(search.toLowerCase());
      return codeOk && searchOk;
    });
  }, [programmes, codeFilter, search]);

  // Sessions for the selected programme
  const progSessions = useMemo(() =>
    sessions.filter(s => s.programme === activeProg)
  , [sessions, activeProg]);

  // Set first visible programme on filter change
  React.useEffect(() => {
    if (filteredProgs.length > 0 && (!activeProg || !filteredProgs.includes(activeProg))) {
      setActiveProg(filteredProgs[0]);
    }
  }, [filteredProgs]);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-semibold">
          {sessions.length} sessions
        </span>
        <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-semibold">
          {programmes.length} programme groups
        </span>
        <span className="bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full font-semibold">
          {new Set(sessions.map(s => s.unit_code)).size} unique units
        </span>
        <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-semibold">
          {new Set(sessions.filter(s => s.room !== 'ONLINE').map(s => s.room)).size} venues
        </span>
      </div>

      {/* Search + code filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search programme… e.g. BBAM Y2, DAC SEM"
            className="w-full pl-8 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-400 outline-none" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={codeFilter} onChange={e => setCodeFilter(e.target.value)}
          className="sm:w-44 py-2.5 px-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-400 outline-none">
          <option value="">All programmes</option>
          {progCodes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Split layout: programme list + grid */}
      <div className="flex gap-0 border border-slate-200 rounded-2xl overflow-hidden min-h-[460px]">

        {/* Left: programme list */}
        <div className="w-44 flex-shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto max-h-[560px]">
          {filteredProgs.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No programmes match</p>
          ) : (
            filteredProgs.map(p => {
              const count = sessions.filter(s => s.programme === p).length;
              return (
                <button key={p} onClick={() => setActiveProg(p)}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-200 transition-colors ${
                    activeProg === p
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-white text-slate-700'
                  }`}>
                  <div className={`text-xs font-bold leading-tight ${activeProg === p ? 'text-white' : 'text-slate-800'}`}>{p}</div>
                  <div className={`text-[10px] mt-0.5 ${activeProg === p ? 'text-indigo-200' : 'text-slate-400'}`}>{count} sessions</div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: timetable grid */}
        <div className="flex-1 p-4 overflow-auto">
          {activeProg ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-black text-slate-800 text-base">{activeProg}</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {progSessions.length} sessions
                </span>
              </div>
              <TimetableGrid sessions={progSessions} />

              {/* Session list below the grid */}
              <div className="mt-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">All Sessions</div>
                <div className="space-y-1">
                  {[...progSessions].sort((a, b) => {
                    const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
                    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.start_time.localeCompare(b.start_time);
                  }).map((s, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs px-3 py-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                      <span className="w-20 font-semibold text-slate-500 flex-shrink-0">{s.day}</span>
                      <span className="w-24 text-slate-400 flex-shrink-0">{s.start_time}–{s.end_time}</span>
                      <span className="w-16 font-bold text-indigo-700 flex-shrink-0">{s.unit_code}</span>
                      <span className="flex-1 text-slate-600 capitalize truncate">{s.unit_title}</span>
                      <span className="text-slate-500 truncate max-w-[120px]">{s.lec_name}</span>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        s.room === 'ONLINE'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.room === 'ONLINE' ? <Wifi size={8} /> : <Building2 size={8} />}
                        {s.room}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Select a programme
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const TimetableAdmin = () => {
  const [tab, setTab]                   = useState('upload');  // 'upload' | 'data'
  const [data, setData]                 = useState(INITIAL);
  const [loading, setLoading]           = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [parseErrors, setParseErrors]   = useState([]);
  const [parsedSessions, setParsedSessions] = useState([]);
  const [parsedProgrammes, setParsedProgrammes] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const campusName =
          CAMPUS_OPTIONS.find(c => c.id === data.campus)?.name || data.campus;

        const res = await api.get('/timetable/timetables/sessions/', {
          params: {
            campus: campusName,
            academicYear: data.academicYear,
            semester: data.semester,
          },
        });

        if (res.data.success && res.data.sessions?.length > 0) {
          setParsedSessions(res.data.sessions);
          setParsedProgrammes(res.data.programmes || []);
          setUploadResult(res.data.data || null);

          // Automatically show timetable tab
          setTab('data');
        }
      } catch (err) {
        console.log('No existing timetable found');
      }
    };

    fetchExisting();
  }, [data.campus, data.academicYear, data.semester]);

  const handleChange = e => setData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel', 'text/csv',
    ].includes(file.type);
    if (!ok) { toast.error('Please upload an .xlsx, .xls, or .csv file'); return; }
    setData(p => ({ ...p, timetableFile: file, timetableName: file.name }));
    setUploadResult(null);
    setParsedSessions([]);
    setParsedProgrammes([]);
    setParseErrors([]);
    toast.success(`File staged: ${file.name}`);
  };

  const clearFile = () => {
    setData(p => ({ ...p, timetableFile: null, timetableName: '' }));
    setUploadResult(null);
    setParsedSessions([]);
    setParsedProgrammes([]);
    setParseErrors([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!data.timetableFile) { toast.error('Please upload a timetable file first'); return; }

    const campusName = CAMPUS_OPTIONS.find(c => c.id === data.campus)?.name  || data.campus;
    const schoolName = SCHOOL_OPTIONS.find(s => s.id === data.school)?.name  || data.school;

    const fd = new FormData();
    fd.append('timetable',    data.timetableFile);
    fd.append('campus',       campusName);
    fd.append('school',       data.school);
    fd.append('schoolName',   schoolName);
    fd.append('academicYear', data.academicYear);
    fd.append('semester',     data.semester);
    fd.append('notes',        data.notes);
    fd.append('uploadedBy',   'admin');

    setLoading(true);
    try {
      const res = await api.post('/timetable/upload', fd);
      if (res.data.success) {
        const result = res.data.data;
        setUploadResult(result);
        setParsedSessions(res.data.sessions || []);
        setParsedProgrammes(result.programmes || []);
        setParseErrors(res.data.parseReport?.errors || []);
        toast.success(
          `Published! ${result.stats.totalSessions} sessions · ${result.stats.programmes} programmes`,
          { duration: 6000 }
        );
        setData(p => ({ ...p, timetableFile: null, timetableName: '', notes: '' }));
        if (fileRef.current) fileRef.current.value = '';
        // Auto-switch to data tab if sessions came back
        if (res.data.sessions?.length > 0) setTab('data');
      } else {
        throw new Error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      toast.error(msg);
      setParseErrors(err.response?.data?.parseReport?.errors || []);
    } finally {
      setLoading(false);
    }
  };

  const campus = CAMPUS_OPTIONS.find(c => c.id    === data.campus);
  const school = SCHOOL_OPTIONS.find(s => s.id    === data.school);
  const sem    = SEMESTER_OPTIONS.find(s => s.value === data.semester);

  const tabs = [
    { id: 'upload', label: 'Upload',      icon: Upload },
    { id: 'data',   label: 'Parsed Data', icon: Table2, badge: parsedSessions.length || null },
  ];

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Timetable Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Upload semester teaching timetables — the AI assistant queries sessions in real time
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            const disabled = t.id === 'data' && parsedSessions.length === 0;
            return (
              <button key={t.id} onClick={() => !disabled && setTab(t.id)}
                disabled={disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  active  ? 'bg-white text-indigo-700 shadow-sm'
                  : disabled ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:text-slate-900'
                }`}>
                <Icon size={15} />
                {t.label}
                {t.badge && (
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab: Upload ───────────────────────────────────── */}
        {tab === 'upload' && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Context */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <GraduationCap size={17} className="text-indigo-500" /> Timetable Context
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Campus" icon={MapPin}>
                  <select name="campus" value={data.campus} onChange={handleChange}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none">
                    {CAMPUS_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </Field>
                <Field label="School" icon={School}>
                  <select name="school" value={data.school} onChange={handleChange} required
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none">
                    {SCHOOL_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Academic Year" icon={Calendar}>
                  <input name="academicYear" value={data.academicYear} onChange={handleChange}
                    required pattern="\d{4}/\d{4}" placeholder="2025/2026"
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
                </Field>
                <Field label="Semester" icon={Clock}>
                  <select name="semester" value={data.semester} onChange={handleChange} required
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none">
                    {SEMESTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-indigo-50 rounded-xl text-xs text-indigo-700 border border-indigo-100">
                <MapPin size={12} className="text-indigo-400" /><span className="font-semibold">{campus?.name}</span>
                <span className="text-indigo-300">·</span>
                <Calendar size={12} className="text-indigo-400" /><span>{data.academicYear}</span>
                <span className="text-indigo-300">·</span>
                <Clock size={12} className="text-indigo-400" />
                <span className="font-semibold">{sem?.label}</span>
                <span className="bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">{sem?.tag}</span>
              </div>
            </div>

            {/* File */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Upload size={17} className="text-indigo-500" /> Timetable File
              </h2>
              <p className="text-xs text-slate-400">
                Standard Zetech campus Excel format — programme group headers (e.g.{' '}
                <code className="bg-slate-100 px-1 rounded">BBAM Y1S1</code>,{' '}
                <code className="bg-slate-100 px-1 rounded">DAC SEM2</code>) with jammed session cells per time slot.
              </p>
              <div onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all flex flex-col items-center gap-3 ${
                  data.timetableName ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}>
                <input type="file" ref={fileRef} className="hidden" onChange={handleFile}
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" />
                {data.timetableName ? (
                  <>
                    <CheckCircle2 size={42} className="text-green-500" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-green-700 break-all">{data.timetableName}</p>
                      <p className="text-xs text-green-500 mt-1">{(data.timetableFile?.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); clearFile(); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 transition-colors mt-1">
                      <Trash2 size={12} /> Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={42} className="text-slate-300" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600">Click to upload</p>
                      <p className="text-xs text-slate-400 mt-1">.xlsx · .xls · .csv — max 10 MB</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <Field label="Notes for Students (optional)">
                <textarea name="notes" value={data.notes} onChange={handleChange} rows={3}
                  maxLength={1000} placeholder="e.g. Effective dates, venue changes, exam reminders…"
                  className="w-full border border-slate-200 bg-slate-50 p-3 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none leading-relaxed" />
                <p className="text-right text-xs text-slate-400 mt-1">{data.notes.length}/1000</p>
              </Field>
            </div>

            {/* Submit */}
            <div className="flex justify-end pb-8">
              <button type="submit" disabled={loading || !data.timetableFile}
                className={`flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5 ${
                  loading || !data.timetableFile
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                }`}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Parsing & Indexing…</>
                  : <><Save size={18} /> Upload & Publish</>}
              </button>
            </div>

            {/* Result card */}
            {uploadResult && (
              <div className="bg-white border border-green-200 rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-300 mb-8">
                <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 text-white flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  <div>
                    <p className="font-bold">Timetable Published</p>
                    <p className="text-green-100 text-xs mt-0.5">{uploadResult.campus} · {uploadResult.academicYear} · {SEMESTER_OPTIONS.find(s => s.value === uploadResult.semester)?.label}</p>
                  </div>
                  <button onClick={() => setTab('data')}
                    className="ml-auto flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg text-xs font-bold">
                    <Table2 size={13} /> View Parsed Data →
                  </button>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-5 gap-2">
                    <StatBadge icon={BookOpen}  value={uploadResult.stats.totalSessions} label="Sessions"   color="border-indigo-100 text-indigo-700 bg-indigo-50" />
                    <StatBadge icon={Hash}       value={uploadResult.stats.uniqueUnits}   label="Units"      color="border-blue-100 text-blue-700 bg-blue-50" />
                    <StatBadge icon={Users}      value={uploadResult.stats.lecturers}     label="Lecturers"  color="border-purple-100 text-purple-700 bg-purple-50" />
                    <StatBadge icon={Building2}  value={uploadResult.stats.rooms}         label="Venues"     color="border-teal-100 text-teal-700 bg-teal-50" />
                    <StatBadge icon={School}     value={uploadResult.stats.programmes}    label="Groups"     color="border-green-100 text-green-700 bg-green-50" />
                  </div>
                  {parseErrors.length > 0 && (
                    <div className="mt-4">
                      <Collapsible trigger={
                        <span className="flex items-center gap-2 text-amber-700">
                          <AlertTriangle size={13} /> {parseErrors.length} rows skipped
                        </span>
                      }>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {parseErrors.map((e, i) => (
                            <div key={i} className="text-xs px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                              <span className="font-bold text-amber-800">Row {e.row} · {e.programme}:</span>{' '}
                              <span className="text-amber-600">{e.content}</span>
                            </div>
                          ))}
                        </div>
                      </Collapsible>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        )}

        {/* ── Tab: Parsed Data ──────────────────────────────── */}
        {tab === 'data' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
              <Table2 size={17} className="text-indigo-500" /> Parsed Timetable Data
            </h2>
            <ParsedDataViewer sessions={parsedSessions} programmes={parsedProgrammes} />
          </div>
        )}

      </div>
    </div>
  );
};

export default TimetableAdmin;