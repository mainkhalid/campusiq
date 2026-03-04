import React from 'react';
import { FaGraduationCap, FaAward, FaBookOpen, FaFileAlt, FaTools, FaBriefcase } from "react-icons/fa";

const ProgrammesSection = () => {
  const programmes = [
    { name: 'Post graduate courses', icon: <FaGraduationCap size={48} /> },
    { name: 'Degree Courses', icon: <FaAward size={48} /> },
    { name: 'Diploma Courses', icon: <FaBookOpen size={48} /> },
    { name: 'Certificate Courses', icon: <FaFileAlt size={48} /> },
    { name: 'TVET Courses', icon: <FaTools size={48} /> },
    { name: 'Corporate Academy', icon: <FaBriefcase size={48} /> },
  ];

  return (
    <section className="py-16 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-[2px] w-12 md:w-24 bg-[#1a2b4c]"></div>
            <h2 className="text-[#1a2b4c] font-black text-xl md:text-2xl tracking-wider uppercase">
              Explore Our Programmes
            </h2>
            <div className="h-[2px] w-12 md:w-24 bg-[#1a2b4c]"></div>
          </div>
          <p className="text-slate-600 text-sm md:text-base italic">
            Zetech University offers a diverse range of programmes under various categories
          </p>
        </div>

        {/* Icon Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {programmes.map((item, index) => (
            <div 
              key={index}
              className="group flex flex-col items-center text-center cursor-pointer transition-transform duration-300 hover:-translate-y-2"
            >
              <div className="mb-4 text-slate-400 group-hover:text-[#1a2b4c] transition-colors duration-300 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-[#1a2b4c] font-bold text-xs md:text-[13px] leading-tight px-2 uppercase tracking-tight">
                {item.name}
              </h3>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ProgrammesSection;