import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Calendar, 
  Save, 
  Eye, 
  Download, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  FileSpreadsheet,
  School
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';

const schoolOptions = [
  { id: 'ict', name: 'School of ICT, Media and Engineering' },
  { id: 'business', name: 'School of Business and Economics' },
  { id: 'law', name: 'School of Law' },
  { id: 'health', name: 'School of Health Sciences' },
  { id: 'education', name: 'School of Education, Arts & Social Science' }
];

const initialState = {
  school: 'ict',
  academicYear: '2024/2025',
  semester: 'Semester 1',
  timetableFile: null,
  timetableName: '',
  notes: ''
};

const TimetableAdmin = () => {
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(initialState);
  const [uploadedTimetable, setUploadedTimetable] = useState(null);
  
  const timetableInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload .xlsx, .xls, or .csv file');
        return;
      }

      setData(prev => ({
        ...prev,
        timetableFile: file,
        timetableName: file.name
      }));
      toast.success(`Timetable file staged: ${file.name}`);
    }
  };

  const clearFile = () => {
    setData(prev => ({
      ...prev,
      timetableFile: null,
      timetableName: ''
    }));
    if (timetableInputRef.current) {
      timetableInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!data.timetableFile) {
      toast.error('Please upload a timetable Excel file');
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('timetable', data.timetableFile);
      formData.append('school', data.school);
      formData.append('schoolName', schoolOptions.find(s => s.id === data.school)?.name || '');
      formData.append('academicYear', data.academicYear);
      formData.append('semester', data.semester);
      formData.append('notes', data.notes);
      formData.append('uploadedBy', 'admin'); 

      const response = await api.post('/timetable/upload', formData);


      if (response.data.success) {
        const result = response.data.data;
        setUploadedTimetable(result);

        toast.success(
          `Timetable published! ${result.stats.totalSessions} sessions parsed successfully`,
          { duration: 5000 }
        );

        // Show warnings if any
        if (response.data.parseReport.warnings.length > 0) {
          toast.warning(
            `${response.data.parseReport.warnings.length} warnings during parsing. Check console for details.`,
            { duration: 4000 }
          );
          console.warn('Parse warnings:', response.data.parseReport.warnings);
        }

        // Show errors if any
        if (response.data.parseReport.errors.length > 0) {
          toast.error(
            `${response.data.parseReport.errors.length} rows had errors. Check console for details.`,
            { duration: 4000 }
          );
          console.error('Parse errors:', response.data.parseReport.errors);
        }

        // Reset form
        setData(initialState);
        if (timetableInputRef.current) {
          timetableInputRef.current.value = '';
        }
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      toast.error(errorMessage);
      
      // Show detailed errors if available
      if (error.response?.data?.errors) {
        console.error('Detailed errors:', error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedSchoolName = schoolOptions.find(s => s.id === data.school)?.name || "Selected School";

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Timetable Management</h1>
            <p className="text-slate-500 text-sm">Upload and manage academic timetables for AI-powered queries</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${
              isPreview ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <Eye size={18} /> {isPreview ? "Back to Edit" : "Student View Preview"}
          </button>
        </div>

        {isPreview ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-700 p-8 text-white">
              <div className="flex items-center gap-3 text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">
                <School size={14} /> Academic Portal
              </div>
              <h2 className="text-3xl font-black mb-2">{selectedSchoolName}</h2>
              <p className="text-indigo-100 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Academic Year: {data.academicYear}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> {data.semester}</span>
              </p>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle size={18} className="text-amber-500" />
                <p className="text-sm text-slate-500 italic">
                  Download the latest timetable for all courses and units. You can also ask the AI assistant about your schedule!
                </p>
              </div>

              {/* Timetable Card */}
              <div className="group bg-slate-50 border border-slate-200 rounded-xl p-6 transition-all hover:shadow-md hover:border-indigo-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm group-hover:bg-indigo-50 transition-colors">
                    <Calendar size={24} className="text-indigo-600" />
                  </div>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Latest</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Academic Timetable</h3>
                <p className="text-xs text-slate-500 mb-4 truncate">
                  {data.timetableName || "Timetable_2024_S1.xlsx"}
                </p>
                <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
                  <Download size={16} /> Download Timetable
                </button>
              </div>

              {data.notes && (
                <div className="mt-8 p-6 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Important Notes
                  </h4>
                  <p className="text-sm text-indigo-800 leading-relaxed whitespace-pre-wrap">{data.notes}</p>
                </div>
              )}

              {uploadedTimetable && (
                <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
                  <h4 className="text-xs font-black text-green-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Upload Statistics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{uploadedTimetable.stats.totalSessions}</div>
                      <div className="text-xs text-green-600">Total Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{uploadedTimetable.stats.uniqueUnits}</div>
                      <div className="text-xs text-green-600">Unique Units</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{uploadedTimetable.stats.lecturers}</div>
                      <div className="text-xs text-green-600">Lecturers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{uploadedTimetable.stats.rooms}</div>
                      <div className="text-xs text-green-600">Venues</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* School & Period Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <School size={18} className="text-indigo-500"/> School & Period Information
                </h2>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Select School *</label>
                <select 
                  name="school" 
                  value={data.school} 
                  onChange={handleChange} 
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 border-slate-200"
                  required
                >
                  {schoolOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Academic Year *</label>
                  <input 
                    name="academicYear" 
                    value={data.academicYear} 
                    onChange={handleChange} 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="e.g. 2024/2025" 
                    pattern="\d{4}/\d{4}"
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Semester *</label>
                  <select
                    name="semester" 
                    value={data.semester} 
                    onChange={handleChange} 
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                    required
                  >
                    <option value="Jan-April">Jan-April</option>
                    <option value="May-Aug">May-Aug</option>
                    <option value="Sept-Dec">Sept-Dec</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Timetable Upload Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Upload size={18} className="text-indigo-500"/> Timetable Upload
              </h2>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <FileSpreadsheet size={14} /> Excel Timetable (.xlsx, .xls, .csv)
                </label>
                <div className="text-xs text-slate-400 mb-2">
                  Expected columns: <code className="bg-slate-100 px-1 rounded">day, unitcode, unittittle, lecName, starttime, end, room</code>
                </div>
                <div 
                  onClick={() => timetableInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    data.timetableName ? 'border-green-200 bg-green-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={timetableInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" 
                  />
                  {data.timetableName ? (
                    <>
                      <CheckCircle2 className="text-green-500" size={40} />
                      <span className="text-sm font-medium text-green-700 text-center break-all px-4">
                        {data.timetableName}
                      </span>
                      <div className="text-xs text-green-600">
                        File size: {(data.timetableFile?.size / 1024).toFixed(2)} KB
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); clearFile(); }} 
                        className="mt-2 text-red-500 hover:text-red-700 text-xs font-bold uppercase flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={12} /> Remove File
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="text-slate-400" size={40} />
                      <div className="text-center">
                        <span className="text-sm text-slate-600 block font-medium">Click to upload or drag & drop</span>
                        <span className="text-xs text-slate-400 block mt-1">Excel file containing timetable data</span>
                        <span className="text-[10px] text-slate-300 block mt-2">Maximum file size: 10MB</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                Notes for Students (Optional)
              </label>
              <textarea 
                name="notes" 
                value={data.notes} 
                onChange={handleChange} 
                rows={3} 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" 
                placeholder="Include any specific instructions (e.g., timetable effective dates, venue changes, exam schedules)..."
                maxLength={1000}
              />
              <div className="text-xs text-slate-400 mt-1 text-right">
                {data.notes.length}/1000 characters
              </div>
            </div>

            <div className="flex justify-end pt-4 pb-12">
              <button 
                type="submit" 
                disabled={loading || !data.timetableFile} 
                className={`px-10 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-xl hover:-translate-y-1 ${
                  loading || !data.timetableFile
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                }`}
              >
                <Save size={20} /> 
                {loading ? 'Processing & Parsing...' : 'Upload & Publish Timetable'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TimetableAdmin;