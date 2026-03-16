import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle, Send, RefreshCw, X,
  GraduationCap, BookOpen, Calendar, Sparkles,
  Microscope, Newspaper, ChevronRight
} from 'lucide-react';

// ── Demo conversation — matches the real bot's tone and data ─────────────────
const DEMO = [
  {
    role: 'assistant',
    text: "Hello! 👋 I'm your Zetech University assistant. How can I help you today?",
  },
  {
    role: 'user',
    text: 'What degree programmes do you offer in ICT?',
  },
  {
    role: 'assistant',
    text: "We offer several ICT degrees including **Bachelor of Science in Computer Science**, **BSc Software Engineering**, and **BSc Information Technology**. All run for 4 years and are offered at the Ruiru campus. Want to know the entry requirements or fees?",
  },
  {
    role: 'user',
    text: 'What are the fees?',
  },
  {
    role: 'assistant',
    text: "BSc Computer Science costs **KES 55,000/semester**. BSc Software Engineering is **KES 57,500/semester**. Both have 8 semesters total. Would you like help with the application process?",
  },
];

// ── Capabilities — reflect what the bot actually covers ──────────────────────
const CAPABILITIES = [
  { icon: GraduationCap, label: 'Programmes, fees & entry requirements' },
  { icon: Calendar,      label: 'Class timetables & room schedules'      },
  { icon: BookOpen,      label: 'Admissions, applications & deadlines'   },
  { icon: Sparkles,      label: 'Scholarships, hostels & campus life'    },
  { icon: Microscope,    label: 'Research projects & innovation'         },
  { icon: Newspaper,     label: 'Campus news & upcoming events'          },
];

// ── Quick action chips — mirrors the real widget ──────────────────────────────
const DEMO_CHIPS = [
  { text: 'Certificates' },
  { text: 'Degrees'      },
  { text: '📝 How to Apply' },
  { text: '📅 My Timetable' },
];

// ── Markdown bold renderer (same logic as Widgets.jsx Msg component) ─────────
function BoldText({ text }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
        /^\*\*[^*]+\*\*$/.test(part)
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : part
      )}
    </>
  );
}

// ── Single chat bubble ────────────────────────────────────────────────────────
function Bubble({ msg, delay }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#1a2b4c] flex items-center justify-center font-black text-white text-[10px] flex-shrink-0 mt-0.5 shadow-sm">
          Z
        </div>
      )}
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
        isUser
          ? 'bg-[#1a2b4c] text-white rounded-tr-sm'
          : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
      }`}>
        {msg.text.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-0.5' : ''}>
            <BoldText text={line} />
          </p>
        ))}
      </div>
    </motion.div>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots({ delay }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="flex gap-2 justify-start items-center"
    >
      <div className="w-7 h-7 rounded-full bg-[#1a2b4c] flex items-center justify-center font-black text-white text-[10px] flex-shrink-0 shadow-sm">
        Z
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ delay: delay + i * 0.15, duration: 0.6, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block"
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIShowcase({ onOpenChat }) {
  // Animate messages appearing one by one
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= DEMO.length) return;
    const t = setTimeout(
      () => setVisibleCount(c => c + 1),
      visibleCount === 0 ? 800 : 1400
    );
    return () => clearTimeout(t);
  }, [visibleCount]);

  // After all messages, loop the demo after a pause
  useEffect(() => {
    if (visibleCount < DEMO.length) return;
    const t = setTimeout(() => setVisibleCount(0), 5000);
    return () => clearTimeout(t);
  }, [visibleCount]);

  const showTyping = visibleCount > 0 && visibleCount < DEMO.length && DEMO[visibleCount]?.role === 'assistant';

  return (
    <section className="py-24 bg-[#1a2b4c] overflow-hidden relative">
      {/* Background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center relative">

        {/* ── Left — widget mockup ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto w-full max-w-[360px]"
        >
          {/* Glow behind the card */}
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-3xl scale-105 pointer-events-none" />

          {/* Widget shell — matches Widgets.jsx exactly */}
          <div className="relative w-full h-[540px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-white/10 bg-white">

            {/* Header — #1a2b4c, "Z" avatar, green dot */}
            <div className="bg-[#1a2b4c] px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-black text-white text-sm shadow-sm">
                    Z
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[#1a2b4c] rounded-full" />
                </div>
                <div>
                  <p className="text-white font-black text-sm leading-tight">Zetech AI</p>
                  <p className="text-green-400 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    Online · replies instantly
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="p-2 rounded-lg text-slate-400">
                  <RefreshCw size={14} />
                </div>
                <div className="p-2 rounded-lg text-slate-400">
                  <X size={15} />
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-hidden bg-slate-50 px-4 py-4 space-y-3">
              {DEMO.slice(0, visibleCount).map((msg, i) => (
                <Bubble key={i} msg={msg} delay={0} />
              ))}

              {/* Typing indicator between messages */}
              {showTyping && <TypingDots delay={0} />}

              {/* Quick action chips — shown after first greeting only */}
              {visibleCount === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-1"
                >
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                    Quick
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEMO_CHIPS.map(chip => (
                      <span key={chip.text}
                        className="flex items-center gap-1 text-[11px] px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-full shadow-sm">
                        {chip.text} <ChevronRight size={10} />
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
              <div className="flex gap-2 items-center">
                <div className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-xs text-slate-400">
                  Ask anything about Zetech…
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Send size={14} className="text-white" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Powered by Zetech AI
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Right — copy ──────────────────────────────────────── */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-3">
              Meet Your Campus AI
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              What would you<br />
              <span className="text-orange-400">like to know?</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-300 text-lg leading-relaxed"
          >
            Ask anything about Zetech University — programmes, fees, timetables,
            hostels, scholarships, research, news and more. Here 24/7, answers in seconds.
          </motion.p>

          {/* Capabilities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            {CAPABILITIES.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 + i * 0.07 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-orange-400" />
                </div>
                <span className="text-slate-200 text-sm font-medium leading-snug">{label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex items-center gap-4 pt-2"
          >
            <button
              onClick={onOpenChat}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-0.5"
            >
              <MessageCircle size={18} />
              Try it now
            </button>
            <p className="text-slate-400 text-xs">No sign-up · Available 24/7</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}