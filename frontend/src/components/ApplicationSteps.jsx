import React from 'react';
import { lotties} from '../assets'
import {Player} from '@lottiefiles/react-lottie-player'

const ApplySteps = () => {
  const steps = [
    {
      id: 1,
      title: "Visit Portal",
      desc: "Go to zetech.ac.ke on your preferred browser.",
      animation: lotties.applynow,
    },
    {
      id: 2,
      title: "Apply Online",
      desc: "Locate and click the 'Apply Online' button.",
      animation: lotties.learnOnline,
    },
    {
      id: 3,
      title: "Fill Details",
      desc: "Enter your academic and personal information.",
      animation: lotties.form,
    },
    {
      id: 4,
      title: "Application Fee",
      desc: "Pay the required fee securely via M-Pesa.",
      animation: lotties.payOnline,
    },
    {
      id: 5,
      title: "Submit",
      desc: "Click 'Register' to complete your application.",
      animation: lotties.success,
    },
  ];

  return (
    
    <section className="py-20 bg-[#e6f7f5]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Process</h2>
          <h1 className="text-4xl font-extrabold text-[#1a2b4c]">Steps to Apply</h1>
        </div>

  
        <div className="relative flex flex-col md:flex-row justify-between gap-8">
 
          <div className="hidden md:block absolute top-24 left-0 w-full h-0.5 bg-gray-200 -z-0" />

          {steps.map((step, index) => (
            <div key={step.id} className="relative z-10 flex-1 flex flex-col items-center group">

              <div className="w-48 h-48 bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-300 overflow-hidden p-4">
                <Player
                  autoplay
                  loop
                  src={step.animation}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>

              <div className="w-10 h-10 rounded-full bg-[#1a2b4c] text-white flex items-center justify-center font-bold mb-4 ring-8 ring-slate-50 group-hover:bg-orange-500 transition-colors">
                {step.id}
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-[#1a2b4c] mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 max-w-[200px] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ApplySteps;