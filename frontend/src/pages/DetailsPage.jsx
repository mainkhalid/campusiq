import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Microscope, User, Target, 
  CheckCircle2, FileText, Briefcase, Calendar,
  Loader2, AlertCircle, DollarSign, Mail
} from 'lucide-react';
import api from '../api/axios';

const DetailsPage = ({ type }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ✅ correct Django URLs
        const endpoint = type === 'research'
          ? `/research/projects/${id}/`
          : `/scholarships/scholarships/${id}/`;

        const response = await api.get(endpoint);
        // Django returns the object directly (not wrapped in response.data.data)
        setData(response.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.detail || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchData();
  }, [id, type]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-KE', { 
        month: 'long', day: 'numeric', year: 'numeric' 
      });
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
        <p className="text-slate-600">Loading details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-slate-800 text-xl font-bold mb-2">Error Loading Data</p>
        <p className="text-slate-600 mb-6">{error}</p>
        <button onClick={() => navigate(-1)}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all">
          Go Back
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <AlertCircle className="text-slate-400 mb-4" size={48} />
        <p className="text-slate-800 text-xl font-bold mb-2">Item Not Found</p>
        <p className="text-slate-600 mb-6">The {type} you're looking for doesn't exist.</p>
        <button onClick={() => navigate(-1)}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all">
          Go Back
        </button>
      </div>
    );
  }

  const isResearch = type === 'research';

  // ✅ Django uses snake_case: applications_open not applicationsOpen
  const getScholarshipStatus = () => {
    if (!data.published)         return { text: 'Draft',   color: 'bg-gray-500'   };
    if (!data.applications_open) return { text: 'Closed',  color: 'bg-red-500'    };
    if (new Date(data.deadline) < new Date())
                                 return { text: 'Expired', color: 'bg-yellow-500' };
    return                              { text: 'Active',  color: 'bg-green-500'  };
  };

  const scholarshipStatus = !isResearch ? getScholarshipStatus() : null;

  // thumbnail is a JSONField dict — use thumbnail_url from serializer
  const thumbnailSrc = data.thumbnail_url || data.thumbnail?.url || '/placeholder.jpg';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* Hero banner */}
      <div className="bg-[#1a2b4c] text-white pt-12 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={20} /> Back
          </button>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <img
              src={thumbnailSrc}
              className="w-full md:w-80 aspect-video rounded-2xl object-cover shadow-2xl border-4 border-white/10"
              alt={isResearch ? data.title : data.name}
            />
            
            <div className="flex-1">
              <span className={`${scholarshipStatus?.color || 'bg-orange-500'} px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 inline-block`}>
                {isResearch ? (data.status || 'Active') : scholarshipStatus.text}
              </span>
              
              <h1 className="text-4xl font-extrabold mb-4 leading-tight">
                {isResearch ? data.title : data.name}
              </h1>
              
              <div className="flex flex-wrap gap-6 text-slate-300">
                <div className="flex items-center gap-2">
                  {isResearch ? <User size={18}/> : <Briefcase size={18}/>}
                  <span>
                    {isResearch
                      ? `Lead: ${data.lead || 'N/A'}`
                      : `Provider: ${data.provider || 'N/A'}`}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar size={18}/>
                  <span>
                    {isResearch
                      ? `Started: ${formatDate(data.created_at)}`
                      : `Deadline: ${formatDate(data.deadline)}`}
                  </span>
                </div>

                {!isResearch && data.amount && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={18}/>
                    <span className="font-bold">{data.amount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 -mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Abstract / Description */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="text-orange-500" />
                {isResearch ? 'Abstract' : 'Description'}
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {isResearch ? data.abstract : data.description}
              </p>
            </div>

            {/* Research: Milestones */}
            {isResearch && data.milestones?.length > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Target className="text-orange-500" /> Project Milestones
                </h2>
                <div className="space-y-4">
                  {data.milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className={`p-2 rounded-full ${m.completed ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                        <CheckCircle2 size={20} />
                      </div>
                      <span className={`font-medium ${m.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                        {m.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scholarship: Requirements */}
            {!isResearch && data.requirements?.length > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="text-orange-500" /> Requirements
                </h2>
                <ul className="space-y-3">
                  {data.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700">
                      <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 size={14} />
                      </div>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scholarship: Tags */}
            {!isResearch && data.tags?.length > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag, i) => (
                    <span key={i} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Scholarship: Eligibility */}
            {!isResearch && data.eligibility && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Eligibility</h4>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl text-blue-700 font-bold">
                  <Target size={20} />
                  {data.eligibility}
                </div>
              </div>
            )}

            {/* Research: Department */}
            {isResearch && data.department && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Department</h4>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl text-orange-700 font-bold">
                  <Microscope size={20} />
                  {data.department}
                </div>
              </div>
            )}

            {/* Scholarship: Contact email — ✅ snake_case */}
            {!isResearch && data.contact_email && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Mail size={18} /> Contact
                </h4>
                <a href={`mailto:${data.contact_email}`}
                  className="text-sm text-blue-600 hover:text-blue-700 underline break-all">
                  {data.contact_email}
                </a>
              </div>
            )}

            {/* Apply button — ✅ snake_case */}
            {!isResearch && data.application_url ? (
              <a
                href={data.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 bg-rose-500 hover:bg-rose-600 text-white text-center rounded-2xl font-bold shadow-lg shadow-rose-200 transition-all"
              >
                Apply Now
              </a>
            ) : (
              <button className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all">
                {isResearch ? 'Contact Lead Researcher' : 'Apply for Scholarship'}
              </button>
            )}

            {/* Scholarship: Application status — ✅ snake_case */}
            {!isResearch && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Application Status</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Published:</span>
                    <span className={`font-bold ${data.published ? 'text-green-600' : 'text-red-600'}`}>
                      {data.published ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Applications:</span>
                    {/* ✅ applications_open not applicationsOpen */}
                    <span className={`font-bold ${data.applications_open ? 'text-green-600' : 'text-red-600'}`}>
                      {data.applications_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {/* ✅ published_at not publishedAt */}
                  {data.published_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Published On:</span>
                      <span className="font-medium text-slate-800">
                        {formatDate(data.published_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;