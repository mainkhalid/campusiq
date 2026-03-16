import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaAward, FaBookOpen, FaFileAlt, FaTools, FaBriefcase } from "react-icons/fa";

const programmes = [
  { name: 'Postgraduate',       icon: FaGraduationCap, level: 'Masters'     },
  { name: 'Degree Courses',     icon: FaAward,         level: 'Degree'      },
  { name: 'Diploma Courses',    icon: FaBookOpen,      level: 'Diploma'     },
  { name: 'Certificate Courses',icon: FaFileAlt,       level: 'Certificate' },
  { name: 'TVET Courses',       icon: FaTools,         level: 'TVET'        },
  { name: 'Corporate Academy',  icon: FaBriefcase,     level: ''            },
];

const ProgrammesSection = () => {
  const navigate = useNavigate();

  const handleClick = (level) => {
    if (level) {
      navigate(`/academics?level=${encodeURIComponent(level)}`);
    } else {
      navigate('/academics');
    }
  };

  return (
    <section className="py-16 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-[2px] w-12 md:w-24 bg-[#1a2b4c]" />
            <h2 className="text-[#1a2b4c] font-black text-xl md:text-2xl tracking-wider uppercase">
              Explore Our Programmes
            </h2>
            <div className="h-[2px] w-12 md:w-24 bg-[#1a2b4c]" />
          </div>
          <p className="text-slate-600 text-sm md:text-base italic">
            Zetech University offers a diverse range of programmes under various categories
          </p>
        </div>

        {/* Icon Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {programmes.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleClick(item.level)}
                className="group flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-2 focus:outline-none"
              >
                <div className="mb-4 text-slate-400 group-hover:text-[#1a2b4c] transition-colors duration-300">
                  <Icon size={48} />
                </div>
                <h3 className="text-[#1a2b4c] font-bold text-xs md:text-[13px] leading-tight px-2 uppercase tracking-tight group-hover:text-orange-500 transition-colors">
                  {item.name}
                </h3>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ProgrammesSection;