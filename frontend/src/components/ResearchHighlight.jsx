import React from 'react';
import { Beaker, Cpu, Zap, ArrowUpRight, ShieldCheck, Atom, Microscope, Binary } from 'lucide-react';

const ResearchHighlight = () => {
  const researchPillars = [
    {
      icon: <ShieldCheck size={20} />,
      title: "Error Mitigation",
      desc: "Developing protocols for the real-time detection and removal of decoherence-induced errors.",
      tag: "Stability"
    },
    {
      icon: <Zap size={20} />,
      title: "Photonic Transport",
      desc: "Utilizing laser-light architecture to carry quantum information across modular networks.",
      tag: "Speed"
    },
    {
      icon: <Cpu size={20} />,
      title: "Calculation Fidelity",
      desc: "Systematically improving the accuracy of algorithmic calculations for complex systems.",
      tag: "Precision"
    }
  ];

  return (
    <div className="relative bg-[#F8FAFC] overflow-hidden border-y border-slate-200 py-24 px-6">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#1a2b4c 1px, transparent 1px)`, backgroundSize: '32px 32px' }}>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        
        {/* Left Side: Abstract Content (5 Columns) */}
        <div className="lg:col-span-5 space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-orange-100 shadow-sm rounded-full mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Pioneering Quantum Faculty
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-[#1a2b4c] leading-[1.1] mb-6 tracking-tight">
              Advancing the <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">Computational Frontier</span>
            </h2>
            
            <p className="text-slate-600 leading-relaxed text-lg">
              Our researchers are spearheading breakthroughs in quantum mechanics that 
              promise to redefine global computational limits. We are transitioning theory 
              into scalable, functional technology for the 2026 digital era.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
             {[
               { label: 'Fidelity', value: '99.9%', icon: <Atom size={14}/> },
               { label: 'Patents', value: '12+', icon: <Binary size={14}/> },
               { label: 'Scale Goal', value: '2026', icon: <Microscope size={14}/> }
             ].map((stat, i) => (
               <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-orange-200 transition-colors group">
                  <div className="text-orange-500 mb-2 group-hover:scale-110 transition-transform">{stat.icon}</div>
                  <p className="text-xl font-black text-[#1a2b4c]">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">{stat.label}</p>
               </div>
             ))}
          </div>

          <div className="pt-4">
            <button className="inline-flex items-center gap-4 bg-[#1a2b4c] text-white px-8 py-4 rounded-full font-bold hover:bg-orange-600 transition-all group shadow-lg shadow-[#1a2b4c]/10">
              Explore the Lab Repository 
              <ArrowUpRight size={20} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Side: Technical Breakdown (7 Columns) */}
        <div className="lg:col-span-7">
          <div className="bg-[#1a2b4c] p-1 md:p-2 rounded-[2.5rem] shadow-2xl shadow-[#1a2b4c]/20">
            <div className="bg-white rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
              {/* Decorative "Quantum" background element */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
              
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="text-2xl font-black text-[#1a2b4c]">Ongoing Research</h3>
                  <p className="text-slate-400 text-sm font-medium">Strategic Tech-Focus Areas</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                  <Beaker className="text-orange-500" size={28} />
                </div>
              </div>
              
              <div className="space-y-4">
                {researchPillars.map((pillar, idx) => (
                  <div key={idx} className="group relative flex gap-6 p-6 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 text-[#1a2b4c] group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                      {pillar.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-[#1a2b4c] text-sm uppercase tracking-wider">
                          {pillar.title}
                        </h4>
                        <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                          {pillar.tag}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Impact Quote Card */}
              <div className="mt-10 p-6 bg-gradient-to-br from-[#1a2b4c] to-[#2a457a] rounded-2xl text-white relative shadow-xl">
                <div className="absolute top-4 right-6 opacity-20">
                  <Cpu size={40} />
                </div>
                <p className="text-[10px] font-black text-orange-400 uppercase mb-3 tracking-[0.2em]">Socio-Economic Impact</p>
                <p className="text-sm md:text-base leading-relaxed font-medium italic opacity-95">
                  "This architecture enables the rapid design of life-saving drugs and optimized global commerce architectures, effectively shrinking time-to-market for complex solutions."
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold">DR</div>
                   <span className="text-xs font-bold text-slate-300">Head of Quantum Labs, Zetech University</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResearchHighlight;