import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { 
  LogOut, User, KeyRound, ChevronDown, X, Eye, EyeOff,
  Check, AlertTriangle, Bell
} from "lucide-react";
import Sidebar from "../components/Admin/Sidebar";
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"

// ── Change Password Modal ─────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.');
      return;
    }
    if (form.new_password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password/', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (e) {
      setError(e.response?.data?.detail || e.response?.data?.current_password?.[0] || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, placeholder }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show[field] ? 'text' : 'password'}
          placeholder={placeholder}
          value={form[field === 'confirm' ? 'confirm_password' : field === 'new' ? 'new_password' : 'current_password']}
          onChange={e => setForm(f => ({ ...f, [field === 'confirm' ? 'confirm_password' : field === 'new' ? 'new_password' : 'current_password']: e.target.value }))}
          className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#121f3e]/20 focus:border-[#121f3e] transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#121f3e] p-2 rounded-lg">
              <KeyRound size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Change Password</h2>
              <p className="text-xs text-slate-400">Keep your account secure</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="bg-emerald-100 p-3 rounded-full">
              <Check size={24} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-emerald-700">Password changed successfully!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Current Password" field="current" placeholder="Enter current password" />
            <Field label="New Password" field="new" placeholder="At least 8 characters" />
            <Field label="Confirm New Password" field="confirm" placeholder="Repeat new password" />

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2.5 rounded-lg text-xs font-medium">
                <AlertTriangle size={13} /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !form.current_password || !form.new_password || !form.confirm_password}
                className="flex-1 py-2.5 rounded-lg bg-[#121f3e] text-white text-sm font-semibold hover:bg-[#1a2b4c] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin Profile Dropdown ────────────────────────────────────
function AdminProfile({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() || 'A'
    : 'A';

  const displayName = user
    ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username)
    : 'Admin';

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all group"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-lg bg-[#121f3e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{displayName}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{user?.email || 'Administrator'}</p>
          </div>
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Profile info */}
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-800">{displayName}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{user?.email || 'Administrator'}</p>
              {user?.is_superuser && (
                <span className="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#121f3e] text-white uppercase tracking-wider">
                  Superuser
                </span>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => { setShowPasswordModal(true); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left"
            >
              <KeyRound size={15} className="text-slate-400" />
              Change Password
            </button>

            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </>
  );
}

// ── Top Header ────────────────────────────────────────────────
function TopHeader({ user, onLogout, sidebarCollapsed }) {
  return (
    <header
      className={`fixed top-0 right-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 transition-all duration-300 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: current section breadcrumb could go here */}
      <div />

      {/* Right: profile */}
      <div className="flex items-center gap-2">
        <AdminProfile user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}

// ── Layout ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed sidebar */}
      <Sidebar onCollapseChange={setSidebarCollapsed} onLogout={handleLogout} />

      {/* Fixed top header — tracks sidebar width */}
      <TopHeader
        user={user}
        onLogout={handleLogout}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main content — offset left for sidebar, top for header */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <main className="flex-1 pt-10">
          <div className="p-4 lg:p-6 w-full">
            <Outlet />
          </div>
        </main>

        <footer className="bg-[#525d74] border-t border-slate-200 py-4 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-white">
            <p>© 2026 Zetech University. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}