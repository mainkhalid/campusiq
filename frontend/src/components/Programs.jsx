import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  Award, 
  BookOpen,
  Users,
  TrendingUp,
  Download
} from 'lucide-react';

const Programs = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['All', 'Business', 'Technology', 'Engineering', 'Health Sciences', 'Education'];

  const programs = [
    {
      id: 1,
      title: 'Bachelor of Business Administration',
      category: 'Business',
      duration: '4 Years',
      mode: 'Full-time / Part-time',
      intake: 'Jan, May, Sep',
      description: 'Comprehensive business program covering management, finance, marketing, and entrepreneurship.',
      careers: ['Business Analyst', 'Marketing Manager', 'Entrepreneur', 'Financial Advisor'],
      popular: true
    },
    {
      id: 2,
      title: 'BSc Computer Science',
      category: 'Technology',
      duration: '4 Years',
      mode: 'Full-time',
      intake: 'Jan, May, Sep',
      description: 'Cutting-edge program in software development, AI, cybersecurity, and data science.',
      careers: ['Software Developer', 'Data Scientist', 'System Architect', 'AI Engineer'],
      popular: true
    },
    {
      id: 3,
      title: 'Bachelor of Engineering (Civil)',
      category: 'Engineering',
      duration: '5 Years',
      mode: 'Full-time',
      intake: 'Jan, Sep',
      description: 'Professional engineering program covering structural design, construction, and project management.',
      careers: ['Civil Engineer', 'Project Manager', 'Structural Designer', 'Construction Manager'],
      popular: false
    },
    {
      id: 4,
      title: 'Bachelor of Science in Nursing',
      category: 'Health Sciences',
      duration: '4 Years',
      mode: 'Full-time',
      intake: 'Jan, Sep',
      description: 'Comprehensive nursing program with clinical placements and hands-on training.',
      careers: ['Registered Nurse', 'Nurse Practitioner', 'Clinical Nurse', 'Healthcare Manager'],
      popular: true
    },
    {
      id: 5,
      title: 'Bachelor of Education',
      category: 'Education',
      duration: '4 Years',
      mode: 'Full-time / Part-time',
      intake: 'Jan, May, Sep',
      description: 'Teacher training program with specializations in various subjects and education levels.',
      careers: ['Primary Teacher', 'Secondary Teacher', 'Education Officer', 'Curriculum Developer'],
      popular: false
    },
    {
      id: 6,
      title: 'MBA - Master of Business Administration',
      category: 'Business',
      duration: '2 Years',
      mode: 'Evening / Weekend',
      intake: 'Jan, May, Sep',
      description: 'Advanced business program for professionals seeking leadership and management roles.',
      careers: ['CEO', 'Business Consultant', 'Operations Manager', 'Strategic Planner'],
      popular: true
    }
  ];

  const filteredPrograms = programs.filter(program => {
    const matchesCategory = selectedCategory === 'All' || program.category === selectedCategory;
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1a2b4c] to-[#2d4263] text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Our Programs</h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Discover world-class academic programs designed to prepare you for success in your chosen career
          </p>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold transition-all ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredPrograms.length} program{filteredPrograms.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPrograms.map((program) => (
            <div 
              key={program.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
            >
              <div className="p-6">
                
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
                        {program.category}
                      </span>
                      {program.popular && (
                        <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full flex items-center gap-1">
                          <TrendingUp size={12} />
                          Popular
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-[#1a2b4c] group-hover:text-orange-600 transition-colors">
                      {program.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {program.description}
                </p>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-sm font-semibold text-gray-700">{program.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Mode</p>
                      <p className="text-sm font-semibold text-gray-700">{program.mode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Award size={16} className="text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Intake</p>
                      <p className="text-sm font-semibold text-gray-700">{program.intake}</p>
                    </div>
                  </div>
                </div>

                {/* Career Paths */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Users size={14} />
                    Career Opportunities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {program.careers.map((career, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {career}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors">
                    Apply Now
                  </button>
                  <button className="px-4 py-3 border-2 border-gray-200 hover:border-orange-500 rounded-lg transition-colors group">
                    <Download size={20} className="text-gray-600 group-hover:text-orange-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredPrograms.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No programs found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Programs;