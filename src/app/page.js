"use client";
import { useState, useRef, useEffect } from "react";

export default function LeadQualifierPage() {
  const [details, setDetails] = useState({
    fullName: "", email: "", phone: "", experience: "0", role: "Financial Advisor"
  });
  
  const [chatPhase, setChatPhase] = useState(false);
  const [messages, setMessages] = useState([]); 
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDetailsChange = (e) => {
    setDetails((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const startInterview = async (e) => {
    e.preventDefault();
    setChatPhase(true);
    setLoading(true);
    setStatus({ type: "info", message: "Connecting to interviewer..." });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ init: true, details }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages([{ role: "ai", content: data.reply }]);
        setLastMessageTime(Date.now());
        setStatus({ type: "", message: "" });
      } else {
        setStatus({ type: "error", message: data.message || "Failed to start interview." });
        setChatPhase(false);
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
      setChatPhase(false);
    } finally {
      setLoading(false);
    }
  };

  const handletChatSubmit = async (e) => {
    e.preventDefault();
    if (!currentInput.trim() || currentInput.length > 1000) return;

    const timeTakenMs = lastMessageTime ? Date.now() - lastMessageTime : 0;
    const userMsg = { role: "user", content: currentInput.trim(), timeTakenMs };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setCurrentInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ init: false, details, messages: newMessages }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (data.finished) {
          const finalMessages = data.reply ? [...newMessages, { role: "ai", content: data.reply }] : newMessages;
          if (data.reply) setMessages(finalMessages);

          if (data.forceEvaluation) {
            setStatus({ type: "error", message: "Security protocol triggered. Finalizing candidate evaluation..." });
            await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ init: false, forceEvaluation: true, details, messages: finalMessages }),
            });
            setStatus({ type: "error", message: "Interview terminated due to strict compliance policies." });
          } else {
            setStatus({ type: "success", message: "Interview completed securely. We will review your profile shortly." });
          }
          setFinished(true);
        } else {
          setMessages([...newMessages, { role: "ai", content: data.reply }]);
          setLastMessageTime(Date.now());
        }
      } else {
        setStatus({ type: "error", message: data.message || "Error processing your response." });
        // Restore input if failed
        setCurrentInput(userMsg.content);
        setMessages(messages);
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-transparent transition-all duration-200";
  const labelCls = "block text-sm font-medium text-slate-400 mb-2";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 selection:bg-cyan-500/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"></div>

      <div className="flex-grow max-w-4xl w-full mx-auto px-4 py-12 sm:px-6 lg:px-8 flex flex-col">
        {/* Header */}
        <header className="text-center mb-10 animate-fade-in shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            AI Partner Interview
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Pramerica Life</span>
            <span className="text-slate-100"> Selection</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium tracking-wide animate-fade-in-up">
            Powered by <span className="text-cyan-400 font-semibold tracking-wider uppercase text-xs">Brogence Agency</span>
          </p>
        </header>

        {/* Status Toast */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-center gap-3 border backdrop-blur-sm animate-slide-down shrink-0 ${
            status.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" :
            status.type === "error" ? "bg-rose-500/10 border-rose-500/30 text-rose-300" :
            "bg-blue-500/10 border-blue-500/30 text-blue-300"
          }`}>
            <span className="text-xl shrink-0">
              {status.type === "success" ? "✅" : status.type === "error" ? "⚠️" : "⏳"}
            </span>
            <p className="font-medium text-sm text-center">{status.message}</p>
          </div>
        )}

        <div className="relative flex-grow flex flex-col bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden outline outline-1 outline-white/5">
          
          {!chatPhase ? (
            // ONBOARDING FORM
            <form onSubmit={startInterview} className="relative z-10 p-8 sm:p-12 space-y-8 h-full flex flex-col justify-center animate-fade-in">
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-sm font-bold">1</div>
                  <h2 className="text-2xl font-semibold text-slate-100">Candidate Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelCls} htmlFor="role">Role Applying For</label>
                    <div className="relative">
                      <select id="role" name="role" value={details.role} onChange={handleDetailsChange} className={`${inputCls} appearance-none cursor-pointer border-indigo-500/40 bg-indigo-950/20 text-indigo-100 font-medium`}>
                        <option value="Financial Advisor">Financial Advisor</option>
                        <option value="Sales Manager">Sales Manager</option>
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="fullName">Full Name</label>
                    <input id="fullName" type="text" name="fullName" required value={details.fullName} onChange={handleDetailsChange} className={inputCls} placeholder="Rajiv Sharma" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="email">Email Address</label>
                    <input id="email" type="email" name="email" required value={details.email} onChange={handleDetailsChange} className={inputCls} placeholder="rajiv@example.com" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="phone">Phone Number</label>
                    <input id="phone" type="tel" name="phone" required value={details.phone} onChange={handleDetailsChange} className={inputCls} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="experience">Sales/Industry Experience</label>
                    <div className="relative">
                      <select id="experience" name="experience" value={details.experience} onChange={handleDetailsChange} className={`${inputCls} appearance-none cursor-pointer`}>
                        <option value="0">None / Entry Level</option>
                        <option value="1-3">1 – 3 Years</option>
                        <option value="3-5">3 – 5 Years</option>
                        <option value="5+">5+ Years</option>
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.2)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(8,145,178,0.4)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Starting Interview..." : "Begin Live Interview"}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </form>
          ) : (
            // CHAT INTERFACE
            <div className="flex flex-col h-[600px] max-h-[70vh]">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <span className="text-white font-bold text-sm">AI</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100">Senior Hiring Manager</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      {details.role} Interview
                    </p>
                  </div>
                </div>
                <div className="text-xs font-medium px-3 py-1 bg-slate-800 rounded-lg text-slate-300">
                  Secure Session
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-950/20">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-down`}>
                    <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      m.role === 'user' 
                        ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50 rounded-tr-sm' 
                        : 'bg-slate-800/60 border border-slate-700/50 text-slate-200 rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))}
                
                {loading && !finished && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl rounded-tl-sm px-5 py-4 flex flex-col gap-2 min-w-[100px]">
                      <div className="flex space-x-1.5 items-center h-4">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Chat Input */}
              {!finished && (
                <div className="p-4 bg-slate-900/80 border-t border-slate-800 shrink-0">
                  <form onSubmit={handletChatSubmit} className="relative flex items-end overflow-hidden outline outline-1 outline-slate-700/50 rounded-xl bg-slate-950/50 focus-within:outline-cyan-500/50 transition-all">
                    <textarea
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handletChatSubmit(e);
                        }
                      }}
                      placeholder="Type your response... (Shift+Enter for new line)"
                      className="w-full bg-transparent border-none text-slate-200 placeholder-slate-600 resize-none px-4 py-4 focus:ring-0 text-[15px] max-h-32 min-h-[56px]"
                      rows={Math.min(4, currentInput.split('\n').length || 1)}
                      maxLength={1000}
                      disabled={loading}
                    />
                    <div className="absolute top-2 right-4 text-xs text-slate-600 font-mono">
                      {currentInput.length}/1000
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !currentInput.trim()}
                      className="m-2 shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      <svg className="w-5 h-5 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-slate-600 space-y-1 shrink-0">
          <p>&copy; {new Date().getFullYear()} Brogence Agency &middot; Pramerica Life Insurance</p>
          <p className="flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            End-to-end encrypted AI Evaluation
          </p>
        </footer>
      </div>
    </div>
  );
}
