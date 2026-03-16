import React from 'react'
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from 'react-router-dom'
import { Player } from '@lottiefiles/react-lottie-player'
import { Toaster } from "sonner"
import { Home as HomeIcon } from 'lucide-react'

import { AuthProvider, useAuth } from './context/AuthContext'

import error404Animation from './assets/lotties/error404.json'

import Home from './layouts/Home'
import FAQ from './pages/FAQ'
import Research from './pages/Research'
import Admissions from './pages/Admissions'
import AcademicsPage from './pages/AcademicsPage'
import StudentLife from './pages/StudentLife'
import DetailsPage from './pages/DetailsPage'
import Study from './pages/Study'
import Contact from './pages/Contact'
import AboutZetech from './pages/AboutZetech'
import AdminDashboard from './layouts/AdminDashboard'
import Programmes from './pages/admin/Programmes'
import Dashboard from './pages/admin/Dashboard'
import History from './pages/admin/History'
import Faqadmin from './pages/admin/Faqadmin'
import Scholarships from './pages/admin/Scholarships'
import AdmissionsAdmin from './pages/admin/AdmissionsAdmin'
import ResearchAdmin from './pages/admin/ResearchAdmin'
import NewsAdmin from './pages/admin/NewsAdmin'
import AIAdmin from './pages/admin/AIAdmin'
import Settings from './pages/admin/Settings'
import Login from './pages/admin/Login'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1a2b4c] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function LoginRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1a2b4c] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Login />
}

function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        <Player
          autoplay
          loop
          src={error404Animation}
          style={{ height: '300px', width: '300px' }}
        />
        <h1 className="text-3xl font-black text-[#1a2b4c] mt-4">PAGE NOT FOUND</h1>
        <p className="text-slate-500 mt-2 mb-8">
          The link might be broken or the page has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-[#1a2b4c] text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 transition-all"
        >
          <HomeIcon size={18} /> Take Me Home
        </button>
      </div>
    </div>
  )
}


function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />}>
        <Route index element={<Study />} />
        <Route path="about" element={<AboutZetech />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="research" element={<Research />} />
        <Route path="admissions" element={<Admissions />} />
        <Route path="academics" element={<AcademicsPage />} />
        <Route path="student-life" element={<StudentLife />} />
        <Route path="contact" element={<Contact />} />
        <Route path="research/:id" element={<DetailsPage type="research" />} />
        <Route path="scholarships/:id" element={<DetailsPage type="scholarship" />} />
      </Route>

      {/* Auth */}
      <Route path="/admin/login" element={<LoginRoute />} />

      {/* Admin — all nested routes are protected via the parent */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="programmes" element={<Programmes />} />
        <Route path="faqadmin" element={<Faqadmin />} />
        <Route path="scholars" element={<Scholarships />} />
        <Route path="history" element={<History />} />
        <Route path="admissions" element={<AdmissionsAdmin />} />
        <Route path="research" element={<ResearchAdmin />} />
        <Route path="news" element={<NewsAdmin />} />
        <Route path="settings" element={<AIAdmin />} />
        <Route path="system-settings" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}