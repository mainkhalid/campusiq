import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle, X, Send, Loader2, RefreshCw,
  ExternalLink, ChevronDown, ChevronUp, Calendar
} from "lucide-react";
import api from "../api/axios";

const DEFAULT_GREETING = "Hello! 👋 I'm your Zetech University assistant. How can I help you find the perfect programme today?";

export default function Widgets() {
  const [isChatOpen, setIsChatOpen]         = useState(false);
  const [greeting, setGreeting]             = useState(DEFAULT_GREETING);
  const [greetingLoaded, setGreetingLoaded] = useState(false);
  const [messages, setMessages]             = useState([]); // empty until greeting loads
  const [inputMessage, setInputMessage]     = useState("");
  const [isLoading, setIsLoading]           = useState(false);
  const [quickActions, setQuickActions]     = useState([]);
  const [quickActionsLoading, setQuickActionsLoading] = useState(true);
  const [suggestedProgrammes, setSuggestedProgrammes] = useState([]);
  const [relevantFaqs, setRelevantFaqs]     = useState([]);
  const [timetableResults, setTimetableResults] = useState([]);
  const [expandedFaq, setExpandedFaq]       = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [showTeaser, setShowTeaser]         = useState(false);
  const [history, setHistory]               = useState([]);

  const messagesEndRef = useRef(null);

  // ── On mount: load greeting + quick actions in parallel ──
  useEffect(() => {
    loadGreetingAndActions();
    const timer = setTimeout(() => setShowTeaser(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load greeting from AISettings + quick actions ────────
  const loadGreetingAndActions = async () => {
    setQuickActionsLoading(true);
    try {
      // Both run in parallel
      const [settingsRes, actionsRes] = await Promise.allSettled([
        api.get("/aiconfig/settings/"),
        api.get("/aibot/quick-actions/"),
      ]);

      // Greeting from admin settings
      let greetingText = DEFAULT_GREETING;
      if (
        settingsRes.status === "fulfilled" &&
        settingsRes.value.data?.data?.greeting_message
      ) {
        greetingText = settingsRes.value.data.data.greeting_message;
      }
      setGreeting(greetingText);
      setMessages([{ role: "assistant", content: greetingText }]);
      setGreetingLoaded(true);

      // Quick actions
      if (
        actionsRes.status === "fulfilled" &&
        actionsRes.value.data?.success
      ) {
        setQuickActions(actionsRes.value.data.data);
        setConnectionError(false);
      } else {
        throw new Error("Quick actions failed");
      }
    } catch (error) {
      console.error("Failed to load widget config:", error);
      setConnectionError(true);
      // Fallback greeting + actions if API unreachable
      setMessages([{ role: "assistant", content: DEFAULT_GREETING }]);
      setGreetingLoaded(true);
      setQuickActions([
        { id: "cert",      text: "Certificates",   query: "Show certificate programmes", category: "browse" },
        { id: "dip",       text: "Diplomas",        query: "Show diploma programmes",     category: "browse" },
        { id: "deg",       text: "Degrees",         query: "Show degree programmes",      category: "browse" },
        { id: "apply",     text: "📝 How to Apply", query: "How do I apply?",             category: "action" },
        { id: "req",       text: "Requirements",    query: "Entry requirements",          category: "info"   },
        { id: "timetable", text: "📅 My Timetable", query: "Show my class schedule",      category: "action" },
        { id: "scholars",  text: "🎓 Scholarships", query: "What scholarships are available?", category: "action" },
      ]);
    } finally {
      setQuickActionsLoading(false);
    }
  };

  // ── Send message ─────────────────────────────────────────
  const sendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setConnectionError(false);

    const currentHistory = [...history, { role: "user", content: message }];

    try {
      const res = await api.post("/aibot/chat/", {
        message,
        history,
      });

      const result = res.data.data;
      const assistantMessage = { role: "assistant", content: result.response };

      setMessages(prev => [...prev, assistantMessage]);
      setHistory([...currentHistory, { role: "assistant", content: result.response }]);

      setSuggestedProgrammes(result.programmes?.slice(0, 5) || []);
      setRelevantFaqs(result.faqs?.slice(0, 3) || []);
      setTimetableResults(result.timetableResults?.slice(0, 5) || []);
      setConnectionError(false);

    } catch (error) {
      console.error("Chat error:", error);
      setConnectionError(true);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting. Please try again, or reach out via:\n\n📧 admissions@zetech.ac.ke\n📞 +254 746 071 362",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Clear conversation — reset to current greeting ────────
  const clearConversation = () => {
    setMessages([{ role: "assistant", content: greeting }]);
    setHistory([]);
    setSuggestedProgrammes([]);
    setRelevantFaqs([]);
    setTimetableResults([]);
    setExpandedFaq(null);
  };

  const handleQuickAction  = (query) => sendMessage(query);
  const handleSendClick    = () => sendMessage(inputMessage);
  const handleKeyPress     = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputMessage); }
  };
  const toggleFaq = (id) => setExpandedFaq(expandedFaq === id ? null : id);

  const handleWhatsAppClick = () => {
    const phone = "254746071362";
    const msg   = encodeURIComponent("Hello! I'm interested in joining Zetech University.");
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const groupedQuickActions = quickActions.reduce((acc, action) => {
    const cat = action.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(action);
    return acc;
  }, {});

  const categoryLabels = {
    browse: "📚 Browse Programmes",
    field:  "🎯 By Field",
    info:   "ℹ️ Information",
    action: "✨ Quick Actions",
  };

  // ────────────────────────────────────────────────────────
  return (
    <>
      {/* WhatsApp Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={handleWhatsAppClick}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 group relative"
          aria-label="Contact us on WhatsApp"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Chat on WhatsApp
          </span>
        </button>
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="mb-4 bg-white rounded-lg shadow-2xl w-80 sm:w-96 h-[550px] flex flex-col animate-in slide-in-from-bottom-5 duration-300 overflow-hidden">

            {/* Header */}
            <div className="bg-[#335395] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold text-sm">Zetech AI Assistant</h3>
                  <p className="text-[10px] text-indigo-100">
                    {connectionError ? "⚠️ Connection issue" : "● Online"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearConversation} className="hover:bg-white/20 p-1 rounded" title="Clear conversation">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 text-sm space-y-3">

              {/* Loading skeleton while greeting fetches */}
              {!greetingLoaded && (
                <div className="mr-auto bg-white border border-gray-200 rounded-lg p-3 max-w-[85%] shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${
                    msg.role === "user"
                      ? "ml-auto bg-[#335395] text-white"
                      : "mr-auto bg-white border border-gray-200"
                  } rounded-lg p-3 max-w-[85%] shadow-sm`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Typing...</span>
                </div>
              )}

              {/* Timetable Results */}
              {timetableResults.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-semibold text-gray-700">📅 Timetable Results</p>
                  {timetableResults.map((session, idx) => (
                    <div key={idx} className="bg-white border border-indigo-100 rounded-lg p-3">
                      <p className="text-xs font-bold text-[#1a2b4c]">
                        {session.unitCode}
                        {session.unitTitle !== "N/A" && (
                          <span className="font-normal text-gray-500"> — {session.unitTitle}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                        <Calendar size={10} />
                        <span>{session.day}, {session.startTime}–{session.endTime}</span>
                        <span className="mx-1">·</span>
                        <span>Room {session.room}</span>
                      </div>
                      {session.lecName && session.lecName !== "Staff" && (
                        <p className="text-[10px] text-gray-400 mt-0.5">👨‍🏫 {session.lecName}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested Programmes */}
              {suggestedProgrammes.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-semibold text-gray-700">🎓 Recommended Programmes</p>
                  {suggestedProgrammes.map((prog) => (
                    <div key={prog.id}
                      className="bg-white border border-indigo-200 rounded-lg p-3 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-xs text-[#1a2b4c] group-hover:text-[#335395]">
                            {prog.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">{prog.code}</p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-[#335395]" />
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] text-gray-600">
                          <span className="font-medium">{prog.level}</span>
                          {prog.school && ` · ${prog.school}`}
                        </p>
                        {prog.duration_years && (
                          <p className="text-[10px] text-gray-600">Duration: {prog.duration_years} Years</p>
                        )}
                        {prog.entry_requirements?.minimumGrade && (
                          <p className="text-[10px] text-gray-600">
                            Min. Grade: {prog.entry_requirements.minimumGrade}
                          </p>
                        )}
                      </div>
                      {prog.study_mode?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {prog.study_mode.map((mode, i) => (
                            <span key={i} className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                              {mode}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Relevant FAQs */}
              {relevantFaqs.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-semibold text-gray-700">💡 Helpful Information</p>
                  {relevantFaqs.map((faq, idx) => (
                    <div key={faq.id || idx} className="bg-white border border-amber-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFaq(faq.id || idx)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-amber-50 transition-colors text-left"
                      >
                        <span className="text-xs font-medium text-gray-800 flex-1 pr-2">{faq.question}</span>
                        {expandedFaq === (faq.id || idx)
                          ? <ChevronUp className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        }
                      </button>
                      {expandedFaq === (faq.id || idx) && (
                        <div className="px-3 py-2 bg-amber-50 border-t border-amber-200">
                          <p className="text-[10px] text-gray-700 whitespace-pre-wrap">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick actions — only on first message, after greeting loads */}
              {greetingLoaded && messages.length === 1 && (
                <div className="space-y-3 mt-4">
                  {quickActionsLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading options...
                    </div>
                  ) : quickActions.length > 0 ? (
                    <>
                      <p className="text-xs font-semibold text-gray-600">Quick Actions:</p>
                      {Object.entries(groupedQuickActions).map(([category, actions]) => (
                        <div key={category} className="space-y-1.5">
                          {categoryLabels[category] && (
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                              {categoryLabels[category]}
                            </p>
                          )}
                          {actions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => handleQuickAction(action.query)}
                              className="w-full bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-lg px-3 py-2 text-left text-xs transition-colors"
                            >
                              {action.text}
                            </button>
                          ))}
                        </div>
                      ))}
                    </>
                  ) : null}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about programmes or schedules..."
                  disabled={isLoading || !greetingLoaded}
                  className="flex-1 px-3 py-2 border rounded-full text-xs focus:outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendClick}
                  disabled={isLoading || !inputMessage.trim() || !greetingLoaded}
                  className="bg-[#4c77ce] text-white p-2 rounded-full hover:bg-[#335395] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              {connectionError && (
                <p className="text-[9px] text-red-500 mt-1 text-center">
                  Connection issue — trying to reconnect...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-indigo-600 hover:bg-[#335395] text-white rounded-full p-4 shadow-lg transition-all duration-300 group relative"
          aria-label={isChatOpen ? "Close chat" : "Open chat"}
        >
          {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}

          {/* Teaser bubble */}
          {!isChatOpen && showTeaser && greetingLoaded && (
            <div className="absolute bottom-20 right-0 mb-2 w-52 bg-white p-3 rounded-lg shadow-xl border border-indigo-100">
              <button
                onClick={(e) => { e.stopPropagation(); setShowTeaser(false) }}
                className="absolute -top-2 -right-2 bg-gray-200 rounded-full p-1"
              >
                <X size={10} />
              </button>
              {/* Show the actual admin-configured greeting truncated */}
              <p className="text-xs text-gray-600 line-clamp-3">{greeting}</p>
              <div className="absolute bottom-[-8px] right-6 w-4 h-4 bg-white border-r border-b border-indigo-100 rotate-45" />
            </div>
          )}

          {/* Unread badge */}
          {!isChatOpen && messages.length > 1 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {messages.length - 1}
            </span>
          )}
        </button>
      </div>
    </>
  );
}