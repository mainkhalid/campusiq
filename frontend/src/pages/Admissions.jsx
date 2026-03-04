import React from 'react';
import {
   FileText,
   CheckCircle,
   Clock,
   DollarSign,
  Users,
  Globe,
  Award,
  Calendar,
  Download
} from 'lucide-react';
import ApplicationSteps from '../components/ApplicationSteps';

const Admissions = () => {
  const prospectusUrl = '/https://www.zetech.ac.ke/index.php/downloads?download=59:students-handbook'; 

  const applicationUrl = 'https://sajili.zetech.ac.ke'; 

  const handleDownloadProspectus = () => {

    const link = document.createElement('a');
    link.href = prospectusUrl;
    link.download = 'Zetech-University-Prospectus.pdf'; 
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyNow = () => {
    window.open(applicationUrl, '_blank');
  };

  const requirements = [
    {
      level: 'Undergraduate',
      icon: <FileText size={24} />,
      requirements: [
        'KCSE Certificate with a minimum of C+ (Plus)',
        'Relevant subject clusters for specific programs',
        'International equivalents accepted (IGCSE, IB, etc.)',
        'Mature entry (25+ years) with relevant experience'
      ]
    },
    {
      level: 'Postgraduate',
      icon: <Award size={24} />,
      requirements: [
        'Bachelor\'s degree from a recognized institution',
        'Minimum Second Class (Lower Division) or equivalent',
        'Relevant work experience may be required',
        'Research proposal for PhD programs'
      ]
    },
    {
      level: 'Diploma',
      icon: <FileText size={24} />,
      requirements: [
        'KCSE Certificate with minimum grade D+ (Plus)',
        'Relevant certificate for diploma progression',
        'O-Level or equivalent qualifications',
        'Mature entry options available'
      ]
    }
  ];

  const intakeSchedule = [
    {
      intake: 'January',
      applicationDeadline:  'January 15',
      startDate: 'Early January',
      status: 'Open'
    },
    {
      intake: 'May',
      applicationDeadline: 'April 15',
      startDate: 'Early May',
      status: 'Coming Soon'
    },
    {
      intake: 'September',
      applicationDeadline: 'August 15',
      startDate: 'Early September',
      status: 'Coming Soon'
    }
  ];

  const benefits = [
    {
      icon: <Users size={40} />,
      title: 'Experienced Faculty',
      description: 'Learn from industry experts and academic professionals'
    },
    {
      icon: <Globe size={40} />,
      title: 'Global Recognition',
      description: 'Internationally accredited programs and qualifications'
    },
    {
      icon: <DollarSign size={40} />,
      title: 'Flexible Payment',
      description: 'Affordable fees with installment payment options'
    },
    {
      icon: <Award size={40} />,
      title: 'Scholarships Available',
      description: 'Merit and need-based financial aid opportunities'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1a2b4c] to-[#2d4263] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold mb-6">Join Zetech University</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Begin your journey to academic excellence and career success. Apply now for our upcoming intakes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleApplyNow}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
            >
              Apply Online Now
            </button>
            <button
              onClick={handleDownloadProspectus}
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-white/20 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download Prospectus
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4 text-orange-500">
                {benefit.icon}
              </div>
              <h3 className="font-bold text-[#1a2b4c] mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Entry Requirements */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">
              Requirements
            </h2>
            <h1 className="text-4xl font-extrabold text-[#1a2b4c] mb-4">
              Entry Requirements
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Review the admission requirements for your desired program level
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {requirements.map((req, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-4 text-orange-500">
                  {req.icon}
                </div>
                <h3 className="text-2xl font-bold text-[#1a2b4c] mb-6">{req.level}</h3>
                <ul className="space-y-3">
                  {req.requirements.map((requirement, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <ApplicationSteps />

      {/* Intake Schedule */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">
              Intake Calendar
            </h2>
            <h1 className="text-4xl font-extrabold text-[#1a2b4c] mb-4">
              Upcoming Intakes
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We have three intakes per year. Choose the one that works best for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {intakeSchedule.map((intake, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-50 to-white border-2 border-gray-200 rounded-xl p-8 hover:border-orange-400 transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="text-orange-500" size={24} />
                  <h3 className="text-2xl font-bold text-[#1a2b4c]">{intake.intake}</h3>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-gray-600">Deadline: <strong>{intake.applicationDeadline}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-gray-600">Starts: <strong>{intake.startDate}</strong></span>
                  </div>
                </div>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                  intake.status === 'Open'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {intake.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#1a2b4c] to-[#2d4263] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-extrabold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of students who have transformed their careers at Zetech University
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleApplyNow}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Apply Now
            </button>
            <button 
              onClick={() => window.location.href = 'mailto:admissions@zetech.ac.ke'}
              className="bg-white text-[#1a2b4c] hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Contact Admissions
            </button>
          </div>
          <p className="mt-8 text-sm text-gray-400">
            Need help? Call us at <a href="tel:+254709912000" className="text-orange-400 hover:underline">+254 709 912 000</a> or email <a href="mailto:admissions@zetech.ac.ke" className="text-orange-400 hover:underline">admissions@zetech.ac.ke</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Admissions;