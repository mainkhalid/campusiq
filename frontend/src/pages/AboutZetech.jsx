import React, { useState } from 'react';
import { 
  Target, Eye, Award, Users, Globe, ArrowUpRight, 
  CheckCircle, MapPin, History, ShieldCheck, 
  Landmark, GraduationCap, Zap, Briefcase,
  Mail, Phone, Calendar, Building2, Sparkles
} from 'lucide-react';

const AboutZetech = () => {
  const [activeTab, setActiveTab] = useState('mission');

  const milestones = [
    { 
      year: '1999', 
      event: 'Founded as Zetech College', 
      desc: 'Established with a vision to provide cutting-edge ICT and Business education in Kenya.',
      impact: '50+ students',
      icon: <Sparkles size={20} />
    },
    { 
      year: '2014', 
      event: 'Accredited as University College', 
      desc: 'Officially registered by the Commission for University Education to offer degree programs.',
      impact: '3,000+ students',
      icon: <GraduationCap size={20} />
    },
    { 
      year: '2022', 
      event: 'Awarded Full University Charter', 
      desc: 'Granted charter by H.E. President Uhuru Kenyatta, marking a new era of excellence.',
      impact: '8,000+ students',
      icon: <Award size={20} />
    },
    { 
      year: '2026', 
      event: 'Continental Expansion', 
      desc: 'Launched regional partnerships and exchange programs across East Africa.',
      impact: 'Pan-African reach',
      icon: <Globe size={20} />
    }
  ];

  const values = [
    { icon: <Award size={22} />, title: 'Excellence', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Commitment to the highest standards in teaching and research.' },
    { icon: <Zap size={22} />, title: 'Innovation', color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Fostering creativity and embracing technological change.' },
    { icon: <Globe size={22} />, title: 'Integrity', color: 'text-green-600', bg: 'bg-green-50', desc: 'Transparency and ethics in all our institutional operations.' },
    { icon: <Users size={22} />, title: 'Student-Centered', color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Prioritizing the holistic growth and success of our students.' }
  ];

  const leaders = [
    { 
      role: 'Chancellor', 
      name: 'Dr. James Mwangi', 
      image: 'https://i.pinimg.com/1200x/6e/59/95/6e599501252c23bcf02658617b29c894.jpg', 
      bio: 'Renowned banker and economist with over 30 years of leadership experience. Spearheading strategic partnerships and institutional growth.',
      education: 'PhD in Economics, MBA',
      tenure: 'Since 2020'
    },
    { 
      role: 'Vice Chancellor', 
      name: 'Prof. Njenga Munene', 
      image: 'https://i.pinimg.com/1200x/6e/59/95/6e599501252c23bcf02658617b29c894.jpg', 
      bio: 'Distinguished academician leading research innovation and academic excellence. Published author with 50+ peer-reviewed papers.',
      education: 'PhD in Engineering',
      tenure: 'Since 2018'
    },
    { 
      role: 'Deputy Vice Chancellor (Academic)', 
      name: 'Prof. Mary Kimani', 
      image: 'https://i.pinimg.com/1200x/6e/59/95/6e599501252c23bcf02658617b29c894.jpg', 
      bio: 'Expert in curriculum development and quality assurance with a passion for student success and educational innovation.',
      education: 'PhD in Education',
      tenure: 'Since 2019'
    }
  ];

  const campuses = [
    {
      name: 'Ruiru Main Campus',
      type: 'Flagship',
      location: 'Thika Superhighway, Ruiru',
      size: '60+ Acres',
      features: ['Ultra-modern ICT Labs', 'Innovation Hub', 'Research Centers', 'Sports Complex', 'Student Residences'],
      students: '12,000+',
      bgColor: 'from-blue-600 to-indigo-700',
      icon: <Building2 size={48} />
    },
    {
      name: 'Nairobi City Campus',
      type: 'Urban Hub',
      location: 'Moi Avenue, CBD',
      size: 'Downtown',
      features: ['Executive Programs', 'Business School', 'Part-time Studies', 'Evening Classes'],
      students: '4,000+',
      bgColor: 'from-orange-500 to-red-600',
      icon: <Landmark size={48} />
    }
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1a2b4c] via-[#243b6b] to-[#1a2b4c] text-white py-20">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest uppercase bg-orange-500 rounded-full">Established 1999</span>
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Invent Your Future</h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
            Zetech University is a premier institution committed to technology-driven education, 
            research, and innovation designed to empower a global generation.
          </p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-6 -mt-10 mb-12 relative z-20">
        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 p-2 flex flex-wrap md:flex-nowrap gap-2 border border-white">
          {[
            { id: 'mission', label: 'Our Purpose', icon: <Target size={18} /> },
            { id: 'history', label: 'Our Journey', icon: <History size={18} /> },
            { id: 'leadership', label: 'Leadership', icon: <Users size={18} /> },
            { id: 'campuses', label: 'Campuses', icon: <Landmark size={18} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === tab.id 
                ? 'bg-[#1a2b4c] text-white shadow-lg' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-[#1a2b4c]'
              }`}
            >
              {tab.icon}
              <span className="uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        {/* MISSION TAB  */}
        {activeTab === 'mission' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck size={120} />
                  </div>
                  <h2 className="text-3xl font-black text-[#1a2b4c] mb-8">Mission & Vision</h2>
                  <div className="space-y-10">
                    <div className="relative pl-8 border-l-4 border-orange-500 rounded-md">
                      <h3 className="text-xs font-black text-orange-600 uppercase tracking-[0.2em] mb-3">The Mission</h3>
                      <p className="text-xl text-slate-700 leading-relaxed font-medium">
                        "To provide <span className="text-[#1a2b4c] font-bold">quality, accessible, and innovative</span> education that empowers individuals to achieve their full potential through technology and entrepreneurship."
                      </p>
                    </div>
                    <div className="relative pl-8 border-l-4 border-[#1a2b4c]">
                      <h3 className="text-xs font-black text-[#1a2b4c] uppercase tracking-[0.2em] mb-3">The Vision</h3>
                      <p className="text-xl text-slate-700 leading-relaxed font-medium">
                        To be a leading technology-driven university in Africa, recognized globally for academic excellence and research impact.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {values.map((v, i) => (
                    <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${v.bg} ${v.color}`}>
                        {v.icon}
                      </div>
                      <h4 className="font-black text-[#1a2b4c] uppercase text-sm tracking-widest mb-2">{v.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-orange-500 rounded-3xl p-8 text-white">
                  <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">Why Zetech?</h3>
                  <ul className="space-y-4">
                    {[
                      'Industry-linked curriculum',
                      'Market-ready graduates',
                      'Global exchange programs',
                      'Ultra-modern tech labs'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm font-bold">
                        <CheckCircle size={18} className="text-orange-200" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#1a2b4c] rounded-3xl p-8 text-white">
                  <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-6">Accreditation</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center"><Briefcase size={20} /></div>
                      <span className="text-xs font-medium">Commission for University Education (CUE)</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center"><GraduationCap size={20} /></div>
                      <span className="text-xs font-medium">EBK & ICPAK Accredited</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IMPROVED HISTORY TAB */}
  {activeTab === 'history' && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
    {/* Header Section */}
    <div className="mb-10 flex justify-between items-start">
      <div>
        <h2 className="text-3xl font-black text-[#1a2b4c]">Our Evolution</h2>
        <p className="text-slate-400 font-medium tracking-wide text-sm uppercase">Institutional Growth Roadmap</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        <History className="text-orange-500" size={24} />
      </div>
    </div>

    {/* Evolution List */}
    <div className="bg-white rounded-[2.5rem] border border-orange-500 shadow-sm p-8 md:p-12 space-y-12 mb-8">
      {milestones.map((milestone, index) => (
        <div key={index} className="flex gap-6 group">
          {/* Icon Column */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              {milestone.icon}
            </div>
            {index !== milestones.length - 1 && (
              <div className="w-px h-full bg-slate-100 my-4"></div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 pb-8">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-sm font-black text-[#1a2b4c] uppercase tracking-widest">
                {milestone.event}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-600 uppercase">
                {milestone.year}
              </span>
            </div>
            <p className="text-slate-500 text-[15px] leading-relaxed max-w-2xl">
              {milestone.desc}
            </p>
          </div>
        </div>
      ))}
      <div className="mt-12 bg-[#1a2b4c] rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute right-6 top-6 opacity-10 text-white">
          <Award size={64} />
        </div>
        
        <p className="text-orange-400 text-xs font-black uppercase tracking-[0.2em] mb-4">
          Institutional Legacy & Impact
        </p>
        
        <p className="text-white text-lg italic font-medium leading-relaxed mb-8 relative z-10">
          "Our journey from a specialized college to a multi-disciplinary university represents 
          our commitment to shrinking the gap between education and industry-ready talent."
        </p>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
            ZU
          </div>
          <div>
            <p className="text-white font-bold text-sm">Office of the Vice Chancellor</p>
            <p className="text-slate-400 text-xs">Zetech University Evolution Strategy</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

        {/* LEADERSHIP TAB */}
        {activeTab === 'leadership' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-[#1a2b4c] mb-4">Leadership Excellence</h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Meet the visionaries driving academic excellence and innovation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {leaders.map((leader, index) => (
                <div 
                  key={index} 
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card */}
                  <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200 hover:border-orange-300">
                    <div className="relative h-80 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a2b4c] via-[#1a2b4c]/60 to-transparent z-10"></div>
                      <img 
                        src={leader.image} 
                        alt={leader.name}
                        className="w-full h-full object-cover transition-transform duration-700 "
                      />
                      
                      {/* Floating role badge */}
                      <div className="absolute top-4 left-4 z-20">
                        <span className="px-4 py-2 bg-orange-400 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg">
                          {leader.role}
                        </span>
                      </div>

                      {/* Name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                        <h3 className="text-2xl font-black text-white mb-1">{leader.name}</h3>
                        <div className="flex items-center gap-4 text-white/80 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {leader.tenure}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap size={16} className="text-blue-600" />
                        <span className="text-slate-600 font-semibold">{leader.education}</span>
                      </div>
                      
                      <p className="text-slate-600 leading-relaxed">
                        {leader.bio}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/*CAMPUSES TAB */}
        {activeTab === 'campuses' && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="text-center mb-12">
      <h2 className="text-4xl md:text-5xl font-black text-[#1a2b4c] mb-4">Our Campuses</h2>
      <p className="text-slate-600 text-lg max-w-2xl mx-auto">
        World-class facilities across strategic locations in Kenya
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campuses.map((campus, index) => (
        <div 
          key={index}
          className="group relative h-[400px] rounded-3xl overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
        >
          <img 
            src={campus.image || "/api/placeholder/800/600"} 
            alt={campus.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-orange-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {campus.type}
              </span>
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <MapPin size={14} />
                <span>{campus.location}</span>
              </div>
            </div>

            <h3 className="text-3xl font-black mb-4 group-hover:text-orange-400 transition-colors">
              {campus.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {campus.features.slice(0, 3).map((feature, idx) => (
                <span 
                  key={idx} 
                  className="text-xs bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white text-black p-3 rounded-full shadow-lg">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

      </main>
    </div>
  );
};

export default AboutZetech;