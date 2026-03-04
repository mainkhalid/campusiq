import React, { useState } from 'react';
import { Heart, Camera,ExternalLink } from 'lucide-react'

const StudentLife = () => {
  const [activeTab, setActiveTab] = useState('clubs');


  const categories = {
    clubs: [
      { name: "Tech Innovators Club", description: "Fostering coding and hardware skills through weekly hackathons.", members: "120+" },
      { name: "Drama & Arts Society", description: "Expressing creativity through theater, dance, and spoken word.", members: "80+" },
      { name: "Environmental Club", description: "Leading sustainability initiatives and campus greening projects.", members: "50+" },
      { name: "Entrepreneurship Hub", description: "Nurturing the next generation of business leaders and startups.", members: "200+" },
    ],
    sports: [
      { name: "Zetech Sparks (Basketball)", description: "Our premier league basketball team competing nationally.", achievements: "3x Champions" },
      { name: "Football Club", description: "Competitive men's and women's teams in the university league.", achievements: "Regional Finalists" },
      { name: "Rugby 7s", description: "High-intensity training and participation in major tournaments.", achievements: "Top 10 National" },
    ]
  };

  const facilities = [
    {
      title: "Student Creative Hub",
      desc: "A modern space for relaxation, indoor games, and social gatherings.",
      img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Modern Fitness Center",
      desc: "Fully equipped gym with certified trainers for student well-being.",
      img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
    

      {/* Main Content */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Left Column: Tabs and Lists */}
          <div className="lg:w-2/3">
            <h2 className="text-3xl font-bold text-[#1a2b4c] mb-8">Clubs & Organizations</h2>
            
            <div className="flex gap-4 mb-8 border-b">
              <button 
                onClick={() => setActiveTab('clubs')}
                className={`pb-4 px-2 font-bold transition-all ${activeTab === 'clubs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}
              >
                Student Clubs
              </button>
              <button 
                onClick={() => setActiveTab('sports')}
                className={`pb-4 px-2 font-bold transition-all ${activeTab === 'sports' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}
              >
                Sports & Athletics
              </button>
            </div>

            <div className="grid gap-6">
              {categories[activeTab].map((item, index) => (
                <div key={index} className="group p-6 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors border-l-4 border-transparent hover:border-blue-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-[#1a2b4c] mb-2">{item.name}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                    </div>
                    <span className="text-xs font-bold bg-white px-3 py-1 rounded-full shadow-sm text-blue-700 whitespace-nowrap">
                      {item.members ? `${item.members} Members` : item.achievements}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Sidebar Style */}
          <div className="lg:w-1/3 space-y-8">
            <div className="bg-[#1a2b4c] text-white p-8 rounded-2xl shadow-lg">
              <Heart className="text-orange-400 mb-4" size={32} />
              <h3 className="text-2xl font-bold mb-4">Wellness & Support</h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                We prioritize your mental and physical health. Access 24/7 counseling, peer mentorship, and medical services on campus.
              </p>
              <button className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                Get Support <ExternalLink size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">Campus Facilities</h3>
              {facilities.map((f, i) => (
                <div key={i} className="relative group overflow-hidden rounded-xl h-48">
                  <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                    <h4 className="text-white font-bold">{f.title}</h4>
                    <p className="text-slate-300 text-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      
      {/* Footer CTA */}
      <section className="py-20 text-center bg-[#e6f7f5]">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Ready to Join Us?</h2>
        <p className="text-slate-500 mb-8">Applications for the next intake are currently open.</p>
        <button className="bg-blue-700 text-white px-10 py-4 rounded-full font-bold hover:bg-blue-800 transition-all shadow-lg hover:shadow-blue-200">
          Apply for Admission
        </button>
      </section>
    </div>
  );
};

export default StudentLife;