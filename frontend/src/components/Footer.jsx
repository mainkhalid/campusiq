import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight 
} from 'lucide-react';
import {logo} from '../assets';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    explore: [
      { name: 'Admissions', href: '/admissions' },
      { name: 'Course Catalog', href: '/academics' },
      { name: 'Student Portal', href: 'https://portal.zetech.ac.ke'},
      { name: 'eLearning', href:'https://elearning.zetech.ac.ke'},
      { name: 'Scholarships', href: '/research' },
    ],
    resources: [
      { name: 'Library', href: '#' },
      { name: 'Research Support', href: '/research' },
      { name: 'Contacts', href: '/contact' },
      { name: 'FAQs', href: '/faq' },
      { name: 'Student Life', href: 'student-life' },
    ]
  };

  return (
    <footer className="bg-[#1a2b4c] text-white pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/*  Brand & About */}
          <div className="space-y-6">
            <img src={logo.zetlogo} alt="Zetech University" className="h-12 " />
            <p className="text-slate-300 text-sm leading-relaxed">
              In pursuit of excellence in technology, business, and education. We empower the next generation of leaders through quality training and innovative research.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/10 hover:bg-orange-500 transition-colors rounded-full"><Facebook size={18} /></a>
              <a href="#" className="p-2 bg-white/10 hover:bg-orange-500 transition-colors rounded-full"><Twitter size={18} /></a>
              <a href="#" className="p-2 bg-white/10 hover:bg-orange-500 transition-colors rounded-full"><Instagram size={18} /></a>
              <a href="#" className="p-2 bg-white/10 hover:bg-orange-500 transition-colors rounded-full"><Linkedin size={18} /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-orange-500">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-300 hover:text-white hover:translate-x-2 transition-all flex items-center gap-2 text-sm group">
                    <ArrowRight size={14} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* \ Resources */}
          <div>
            <h3 className="text-lg font-bold mb-6 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-orange-500">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-300 hover:text-white hover:translate-x-2 transition-all flex items-center gap-2 text-sm group">
                    <ArrowRight size={14} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-6 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-orange-500">
              Contact Us
            </h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="text-orange-500 shrink-0" size={20} />
                <p>Main Campus, Thika Road, Ruiru, Kenya</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-orange-500 shrink-0" size={20} />
                <p>+254 700 278 340</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-orange-500 shrink-0" size={20} />
                <p>Btj0r@example.com</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>© {currentYear} Zetech University. All Rights Reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;