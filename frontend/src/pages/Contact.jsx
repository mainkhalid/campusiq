import React, { useEffect, useState } from 'react'
import {
  Phone, Mail, MapPin, Clock, MessageCircle,
  ArrowRight, ExternalLink, Users, BookOpen,
  DollarSign, Headphones, Globe, Copy, CheckCheck
} from 'lucide-react'
import api from '../api/axios'

const FALLBACK = {
  phone_primary:    '+254 709 912 000',
  phone_secondary:  '+254 746 071 362',
  email_general:    'info@zetech.ac.ke',
  email_admissions: 'admissions@zetech.ac.ke',
  email_support:    'support@zetech.ac.ke',
  whatsapp:         '254746071362',
  address:          'Zetech University, Ruiru Campus, Off Thika Road, Ruiru, Kenya',
}

const DEPARTMENTS = [
  { name: 'Admissions Office',  icon: Users,     email: 'admissions@zetech.ac.ke', desc: 'Applications, intake dates, entry requirements'  },
  { name: 'Academic Affairs',   icon: BookOpen,  email: 'academics@zetech.ac.ke',  desc: 'Programmes, timetables, transcripts'              },
  { name: 'Finance Office',     icon: DollarSign,email: 'finance@zetech.ac.ke',    desc: 'Fee payments, HELB, invoices'                     },
  { name: 'Student Services',   icon: Headphones,email: 'students@zetech.ac.ke',   desc: 'Welfare, counselling, ID cards, clubs'            },
  { name: 'ICT Support',        icon: Globe,     email: 'ict@zetech.ac.ke',        desc: 'Portal access, email, technical issues'           },
]

const CAMPUSES = [
  {
    name:    'Ruiru Campus (Main)',
    address: 'Off Thika Road, Ruiru',
    hours:   'Mon–Fri: 7:30am – 5:00pm',
    mapUrl:  'https://maps.google.com/?q=Zetech+University+Ruiru',
    badge:   'Headquarters',
  },
  {
    name:    'Nairobi Campus',
    address: 'Nairobi',
    hours:   'Mon–Fri: 8:00am – 5:00pm',
    mapUrl:  'https://maps.google.com/?q=Zetech+University+Nairobi',
    badge:   null,
  },
  {
    name:    'Mangu Campus',
    address: 'Mangu, Thika',
    hours:   'Mon–Fri: 8:00am – 5:00pm',
    mapUrl:  'https://maps.google.com/?q=Zetech+University+Witeithie',
    badge:   null,
  },
]

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy}
      className="p-1.5 rounded-lg hover:bg-white/20 text-slate-400 hover:text-white transition-all flex-shrink-0"
      title="Copy">
      {copied ? <CheckCheck size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  )
}

export default function Contact() {
  const [contact, setContact] = useState(FALLBACK)

  useEffect(() => {
    api.get('/university/settings/')
      .then(res => {
        const d = res.data?.data ?? res.data
        if (d?.contact) setContact(prev => ({ ...prev, ...d.contact }))
      })
      .catch(() => {})
  }, [])

  const phone    = contact.phone_primary    || FALLBACK.phone_primary
  const phone2   = contact.phone_secondary  || FALLBACK.phone_secondary
  const emailG   = contact.email_general    || FALLBACK.email_general
  const emailAdm = contact.email_admissions || FALLBACK.email_admissions
  const emailSup = contact.email_support    || FALLBACK.email_support
  const address  = contact.address          || FALLBACK.address
  const waNumber = (contact.whatsapp || FALLBACK.whatsapp).replace(/\D/g, '')
  const waLink   = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hello! I'd like to get in touch with Zetech University.")}`

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-[#1a2b4c] py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">Get In Touch</p>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 max-w-xl leading-tight">
            We're here<br />to help
          </h1>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Reach out via phone, email or WhatsApp. Our team is available Monday to Friday, 7:30am – 5:00pm EAT.
          </p>
        </div>
      </div>

      {/* Primary contact cards */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Phone */}
          <a href={`tel:${phone}`}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
              <Phone size={19} className="text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Main Line</p>
            <p className="font-black text-[#1a2b4c] text-sm">{phone}</p>
            {phone2 && <p className="text-slate-400 text-xs mt-1">{phone2}</p>}
          </a>

          {/* Email */}
          <a href={`mailto:${emailG}`}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors">
              <Mail size={19} className="text-orange-500 group-hover:text-white transition-colors" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">General Email</p>
            <p className="font-black text-[#1a2b4c] text-sm break-all">{emailG}</p>
          </a>

          {/* WhatsApp */}
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
              <MessageCircle size={19} className="text-green-600 group-hover:text-white transition-colors" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">WhatsApp</p>
            <p className="font-black text-[#1a2b4c] text-sm">Chat with us</p>
            <p className="text-slate-400 text-xs mt-1">Typically replies fast</p>
          </a>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <MapPin size={19} className="text-purple-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Main Campus</p>
            <p className="font-black text-[#1a2b4c] text-sm leading-snug">{address}</p>
          </div>
        </div>
      </div>

      {/* Departments */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Departments</p>
            <h2 className="text-3xl font-black text-[#1a2b4c]">Reach the right team</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEPARTMENTS.map(({ name, icon: Icon, email, desc }) => (
              <a key={name} href={`mailto:${email}`}
                className="group flex items-start gap-4 p-6 bg-slate-50 hover:bg-white border border-slate-100 hover:border-orange-200 hover:shadow-md rounded-2xl transition-all">
                <div className="w-10 h-10 bg-white group-hover:bg-orange-50 border border-slate-200 group-hover:border-orange-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-sm">
                  <Icon size={17} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-[#1a2b4c] text-sm mb-0.5">{name}</p>
                  <p className="text-slate-500 text-xs mb-2 leading-relaxed">{desc}</p>
                  <p className="text-orange-500 text-xs font-bold truncate">{email}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Campuses */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Locations</p>
            <h2 className="text-3xl font-black text-[#1a2b4c]">Find a campus</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {CAMPUSES.map(({ name, address, hours, mapUrl, badge }) => (
              <div key={name} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Map embed area */}
                <div className="h-36 bg-gradient-to-br from-[#1a2b4c] to-[#2d4263] relative flex items-center justify-center">
                  <MapPin size={32} className="text-orange-400 opacity-60" />
                  {badge && (
                    <span className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                      {badge}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-black text-[#1a2b4c] text-sm mb-1">{name}</h3>
                  <div className="flex items-start gap-2 text-slate-500 text-xs mb-1">
                    <MapPin size={11} className="mt-0.5 flex-shrink-0 text-slate-400" />
                    {address}
                  </div>
                  <div className="flex items-start gap-2 text-slate-500 text-xs mb-4">
                    <Clock size={11} className="mt-0.5 flex-shrink-0 text-slate-400" />
                    {hours}
                  </div>
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600 text-xs font-bold transition-colors">
                    Get Directions <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick contact details strip */}
      <section className="bg-[#1a2b4c] py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Admissions email */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Admissions Email</p>
                <p className="text-white font-bold text-sm">{emailAdm}</p>
              </div>
              <CopyButton value={emailAdm} />
            </div>

            {/* Support email */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">IT / Support Email</p>
                <p className="text-white font-bold text-sm">{emailSup}</p>
              </div>
              <CopyButton value={emailSup} />
            </div>

            {/* Hours */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <Clock size={18} className="text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Office Hours</p>
                <p className="text-white font-bold text-sm">Mon – Fri, 7:30am – 5:00pm EAT</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white text-center">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Still unsure?</p>
        <h2 className="text-3xl font-black text-[#1a2b4c] mb-3">Try our AI assistant</h2>
        <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
          Ask about programmes, fees, admissions or campus life — instant answers, anytime
        </p>
        <a href="/"
          className="inline-flex items-center gap-2 bg-[#1a2b4c] hover:bg-[#243660] text-white px-8 py-4 rounded-xl font-black text-sm transition-all shadow-lg hover:-translate-y-0.5">
          <MessageCircle size={15} /> Chat with the AI <ArrowRight size={15} />
        </a>
      </section>
    </div>
  )
}