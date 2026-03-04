import React from 'react';
import { ShieldCheck, AlarmClock, Landmark, TrendingUp, Sparkles } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: "Quality Guaranteed",
      desc: "Highly Trained and Experienced faculty and State-of-the-Art Learning Facilities. Globally Recognised Qualifications, Chartered by CUE and TVETA accredited.",
      icon: <ShieldCheck className="w-8 h-8 text-[#1a2b4c]" />,
    },
    {
      title: "Timely Completion",
      desc: "Trimester System and Unit Exemptions for Recognised Qualifications. We ensure timely release of Exam Results and offer Blended Mode Learning.",
      icon: <AlarmClock className="w-8 h-8 text-[#1a2b4c]" />,
    },
    {
      title: "Students Finance",
      desc: "Affordable, Flexible (installment) Fee Payment Schedules. Access to HELB loans and various University Scholarships to support your journey.",
      icon: <Landmark className="w-8 h-8 text-[#1a2b4c]" />,
    },
    {
      title: "Great Prospects",
      desc: "Mandatory Training on Employability and Entrepreneurship. Exposure through Industry Visits, Linkages, and Collaboration with global partners.",
      icon: <TrendingUp className="w-8 h-8 text-[#1a2b4c]" />,
    },
    {
      title: "Vibrant Experience",
      desc: "Sporting activities, Career Guidance, and Student Welfare. International Academic Exchange Programs and structured Industrial Placement.",
      icon: <Sparkles className="w-8 h-8 text-[#1a2b4c]" />,
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Modern Section Header */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="h-px bg-gray-300 w-16 md:w-32"></div>
          <h2 className="text-xl md:text-3xl font-bold text-[#1a2b4c] whitespace-nowrap uppercase tracking-wider">
            Why Zetech University
          </h2>
          <div className="h-px bg-gray-300 w-16 md:w-32"></div>
        </div>

        {/* Improved Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {features.map((f, i) => (
            <div 
              key={i} 
              className="group p-8 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center"
            >
              {/* Icon Container with subtle background */}
              <div className="mb-6 p-4 rounded-full bg-slate-50 group-hover:bg-[#1a2b4c] group-hover:text-white transition-colors duration-300">
                {React.cloneElement(f.icon, { className: "w-10 h-10 group-hover:text-white transition-colors" })}
              </div>
              
              <h3 className="text-lg font-bold text-[#b91c1c] mb-4 group-hover:text-[#1a2b4c] transition-colors">
                {f.title}
              </h3>
              
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;