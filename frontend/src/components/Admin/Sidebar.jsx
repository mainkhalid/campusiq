import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, GraduationCap, UserCheck,
  Microscope, MessageSquare, History, Newspaper,
  Settings, LogOut, Menu, ChevronLeft
} from 'lucide-react';
import edlogo from '../../assets/images/edlogo.png';

const menuItems = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'programmes',   label: 'Programmes',   icon: BookOpen,        path: '/admin/programmes' },
  { id: 'scholarships', label: 'Scholarships', icon: GraduationCap,   path: '/admin/scholars' },
  { id: 'timetables',   label: 'Timetables',   icon: UserCheck,       path: '/admin/admissions' },
  { id: 'research',     label: 'Research',     icon: Microscope,      path: '/admin/research' },
  { id: 'news',         label: 'News & Events', icon: Newspaper,      path: '/admin/news' },
];

const secondaryItems = [
  { id: 'faqs',       label: 'FAQs',           icon: MessageSquare, path: '/admin/faqadmin' },
  { id: 'history',    label: 'History',        icon: History,       path: '/admin/history' },
  { id: 'aisettings', label: 'AIBot Settings', icon: Settings,      path: '/admin/settings' },
];

const NavItem = ({ item, collapsed }) => (
  <NavLink
    to={item.path}
    title={collapsed ? item.label : undefined}
    className={({ isActive }) =>
      `flex items-center gap-3.5 px-4 py-3 mx-2 rounded-lg transition-all duration-150 group
      ${isActive
        ? 'bg-[#121f3e] text-white shadow-md'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <span className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`}>
          <item.icon size={20} />
        </span>
        {!collapsed && (
          <span className="font-medium text-[14px] truncate">{item.label}</span>
        )}
      </>
    )}
  </NavLink>
);

const Sidebar = ({ onCollapseChange, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapseChange?.(next);
  };

  // Notify parent of initial state
  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, []);

  return (
    <div
      className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 h-screen fixed top-0 left-0 z-40 shadow-sm ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100 flex-shrink-0">
        {!collapsed && (
          <img src={edlogo} alt="Zetech Logo" className="h-8 w-auto" />
        )}
        <button
          onClick={toggle}
          className={`p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {menuItems.map(item => (
          <NavItem key={item.id} item={item} collapsed={collapsed} />
        ))}

        {/* Section label */}
        <div className="pt-5 pb-1">
          {!collapsed && (
            <p className="px-6 text-[10px] font-bold text-blue-500 uppercase tracking-[1.5px]">
              Support & Records
            </p>
          )}
          {collapsed && <div className="border-t border-slate-100 mx-3" />}
        </div>

        {secondaryItems.map(item => (
          <NavItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer — system settings + logout */}
      <div className="border-t border-slate-100 p-3 flex-shrink-0 space-y-0.5">
        {!collapsed && (
          <p className="px-4 pb-1 text-[10px] font-bold text-blue-500 uppercase tracking-[1.5px]">
            Settings
          </p>
        )}
        <NavLink
          to="/admin/system-settings"
          title={collapsed ? 'System Settings' : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3.5 w-full px-4 py-3 rounded-lg transition-all
            ${isActive
              ? 'bg-[#121f3e] text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            } ${collapsed ? 'justify-center' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span className="font-medium text-[14px]">System Settings</span>}
            </>
          )}
        </NavLink>

        <button
          onClick={onLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="font-medium text-[14px]">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;