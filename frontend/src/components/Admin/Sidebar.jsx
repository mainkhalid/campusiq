import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  UserCheck, 
  Microscope, 
  MessageSquare, 
  History, 
  Newspaper,
  Settings,
  LogOut,
  Menu,
  ChevronLeft
} from 'lucide-react';
import  edlogo from '../../assets/images/edlogo.png';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Your original data structure
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/admin/dashboard' },
    { id: 'programmes', label: 'Programmes', icon: <BookOpen size={22} />, path: '/admin/programmes' },
    { id: 'scholarships', label: 'Scholarships', icon: <GraduationCap size={22} />, path: '/admin/scholars' },
    { id: 'admissions', label: 'Admissions', icon: <UserCheck size={22} />, path: '/admin/admissions' },
    { id: 'research', label: 'Research', icon: <Microscope size={22} />, path: '/admin/research' },
    { id: 'news', label: 'News & Events', icon: <Newspaper size={22} />, path: '/admin/news' },
  ];

  const secondaryItems = [
    { id: 'faqs', label: 'FAQs', icon: <MessageSquare size={22} />, path: '/admin/faqadmin' },
    { id: 'history', label: 'History', icon: <History size={22} />, path: '/admin/history' },
  ];

  return (
    <div
      className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 h-screen fixed shadow-sm ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header - Clean White with Logo */}
      <div className="p-5 flex items-center justify-between min-h-[80px]">
        {!isCollapsed && (
          <img
            src={edlogo}
            alt="Zetech Logo"
            className="h-10 w-auto"
          />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto pt-4">
        {/* Main Navigation Group */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-3.5 transition-all duration-200 
                ${isActive 
                  ? 'bg-[#121f3e] text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="font-medium text-[15px]">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Support/Info Grouping - Styled like the 'Britam' header in the image */}
        <div className="mt-8">
          {!isCollapsed && (
            <h3 className="px-6 mb-2 text-[11px] font-bold text-blue-600 uppercase tracking-[1.5px]">
              Support & Records
            </h3>
          )}
          {secondaryItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-3.5 transition-all
                ${isActive ? 'bg-[#121f3e] text-white' : 'text-slate-600 hover:bg-slate-50'}`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="font-medium text-[15px]">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer - Settings and Logout */}
      <div className="p-4 border-t border-slate-100">
        {!isCollapsed && (
          <h3 className="px-2 mb-2 text-[11px] font-bold text-blue-600 uppercase tracking-[1.5px]">
            Settings
          </h3>
        )}
        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all ${
              isActive ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'
            }`
          }
        >
          <Settings size={20} />
          {!isCollapsed && <span className="font-medium text-[14px]">System Settings</span>}
        </NavLink>

        <button className="flex items-center gap-4 w-full px-3 py-2.5 mt-1 rounded-lg text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium text-[14px]">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;