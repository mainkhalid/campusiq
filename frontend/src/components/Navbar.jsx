import React, { useState } from 'react';
import { ChevronDown, Search, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {logo} from '../assets';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  const navLinks = [
    { 
      name: 'HOME', 
      href: '/', 
      hasDropdown: false 
    },
    { 
      name: 'ABOUT ZU', 
      href: '/about', 
      hasDropdown: true,
      subLinks: [
        { name: 'About Zetech', href: '/about' },
        { name: 'Mission & Vision', href: '/about#mission' },
        { name: 'Leadership', href: '/about#leadership' },
        { name: 'Accreditation', href: '/about#accreditation' },
        { name: 'Campus Locations', href: '/about#campuses' },
        { name: 'student life', href: '/student-life' },
      ]
    },
    { 
      name: 'ADMISSIONS & REGISTRATION', 
      href: '/admissions', 
      hasDropdown: true,
      subLinks: [
        { name: 'How to Apply', href: '/admissions' },
        { name: 'Online Application Portal', href: 'https://sajili.zetech.ac.ke/index.php', external: true },
        { name: 'Entry Requirements', href: '/admissions/requirements' },
        { name: 'Fee Structure', href: '/admissions/fees' },
        { name: 'Scholarships & Financial Aid', href: '/admissions/scholarships' },
        { name: 'International Students', href: '/admissions/international' },
        { name: 'Transfer Students', href: '/admissions/transfer' },
      ]
    },
    { 
      name: 'PROGRAMS & COURSES', 
      href: '/academics', 
      hasDropdown: true,
      subLinks: [
        { name: 'All Programs',           href: '/academics' },
        { name: 'Postgraduate Programs',   href: '/academics?level=Masters' },
        { name: 'Degree Courses',          href: '/academics?level=Degree' },
        { name: 'Diploma Courses',         href: '/academics?level=Diploma' },
        { name: 'Certificate Courses',     href: '/academics?level=Certificate' },
        { name: 'TVET Courses',            href: '/academics?level=TVET' },
      ]
    },
    { 
      name: 'RESEARCH & SCHOLARSHIPS', 
      href: '/research', 
      hasDropdown: true,
      subLinks: [
        { name: 'Research Overview', href: '/research' },
        { name: 'Research Centers', href: '/research/centers' },
        { name: 'Publications', href: '/research/publications' },
        { name: 'Research Projects', href: '/research/projects' },
        { name: 'Collaborate With Us', href: '/research/collaborate' },
      ]
    }
    
  ];

  const utilityLinks = [
    { name: 'Student Portal', href: 'https://portal.zetech.ac.ke', external: true },
    { name: 'eLearning', href: 'https://elearning.zetech.ac.ke', external: true },
    { name: 'FAQ', href: '/faq' },
  ];

  const isActiveLink = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchTerm);
      setSearchOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <nav className="w-full bg-white border-t-4 border-[#1a2b4c] shadow-sm font-sans sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-[#1a2b4c] text-white py-2 text-xs md:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex gap-4 md:gap-6">
            <a href="mailto:info@zetech.ac.ke" className="hover:text-orange-400 transition-colors">
              MAIL: info@zetech.ac.ke
            </a>
            <a href="tel:+254709912000" className="hidden sm:inline hover:text-orange-400 transition-colors">
              PHONE: +254 709 912 000
            </a>
          </div>
          <div className="flex gap-4 md:gap-6 font-medium">
            {utilityLinks.map((link) => (
              link.external ? (
                <a 
                  key={link.name} 
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="hover:text-orange-400 transition-colors"
                >
                  {link.name}
                </a>
              ) : (
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className="hover:text-orange-400 transition-colors"
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center py-2">
            <img src={logo.zetlogo} alt="Zetech University Logo" className="h-16 w-auto object-contain" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8 h-full">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group h-full flex items-center">
                <Link
                  to={link.href}
                  className={`flex items-center gap-1 text-[13px] font-bold tracking-wide transition-colors duration-200 
                    ${isActiveLink(link.href) ? 'text-[#1a2b4c]' : 'text-slate-700 hover:text-[#1a2b4c]'}`}
                >
                  {link.name}
                  {link.hasDropdown && (
                    <ChevronDown size={14} className="text-orange-500 group-hover:rotate-180 transition-transform" />
                  )}
                </Link>

                {/* Dropdown Menu */}
                {link.subLinks && (
                  <div className="absolute top-full left-0 w-64 bg-white shadow-xl border-t-2 border-orange-500 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="py-2">
                      {link.subLinks.map((sub) => (
                        sub.external ? (
                          <a
                            key={sub.name}
                            href={sub.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-2 text-[12px] text-slate-700 hover:bg-slate-50 hover:text-[#1a2b4c] font-semibold transition-colors"
                          >
                            {sub.name}
                          </a>
                        ) : (
                          <Link
                            key={sub.name}
                            to={sub.href}
                            className="block px-4 py-2 text-[12px] text-slate-700 hover:bg-slate-50 hover:text-[#1a2b4c] font-semibold transition-colors"
                          >
                            {sub.name}
                          </Link>
                        )
                      ))}
                    </div>
                  </div>
                )}
              
                {isActiveLink(link.href) && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1a2b4c]" />
                )}
              </div>
            ))}
            
          </div>

          {/* Mobile Button */}
          <div className="lg:hidden flex items-center gap-3">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-[#1a2b4c]"
              aria-label="Menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-6 space-y-1 shadow-lg overflow-y-auto max-h-[80vh] animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <div key={link.name}>
              <div className="flex justify-between items-center px-3 py-3 border-b border-gray-50">
                <Link 
                  to={link.href} 
                  onClick={() => !link.hasDropdown && setIsOpen(false)}
                  className={`text-base font-bold ${
                    isActiveLink(link.href) ? 'text-orange-600' : 'text-[#1a2b4c]'
                  }`}
                >
                  {link.name}
                </Link>
                {link.hasDropdown && (
                  <ChevronDown size={20} className="text-orange-500" />
                )}
              </div>
              {link.subLinks && (
                <div className="bg-slate-50 pl-6 py-2">
                  {link.subLinks.map((sub) => (
                    sub.external ? (
                      <a
                        key={sub.name}
                        href={sub.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block py-2 text-sm text-slate-600 font-medium hover:text-orange-600 transition-colors"
                      >
                        {sub.name}
                      </a>
                    ) : (
                      <Link
                        key={sub.name}
                        to={sub.href}
                        onClick={() => setIsOpen(false)}
                        className="block py-2 text-sm text-slate-600 font-medium hover:text-orange-600 transition-colors"
                      >
                        {sub.name}
                      </Link>
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;