import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Plus, Search, Trash2, Copy, RefreshCw, Download, MessageSquare,
  Brain, ArrowDown, Info, Check, ShieldAlert, Paperclip, ChevronRight, Wind, BarChart3, Quote
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  {
    text: "Suggest a 5-minute breathing exercise for stress relief",
    icon: Wind
  },
  {
    text: "How can I manage work burnout indicators?",
    icon: BarChart3
  },
  {
    text: "Recommend a brief CBT coping technique",
    icon: Sparkles
  },
  {
    text: "Provide a daily motivational quote and reflection",
    icon: Quote
  }
];

// Simple Markdown + Code block parser for rendering AI responses nicely
function MarkdownRenderer({ content }) {
  const rendered = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3 class="text-sm font-extrabold text-[#1F1F2E] mt-3 mb-1.5">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-base font-extrabold text-[#1F1F2E] mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-lg font-black text-[#1F1F2E] mt-5 mb-2.5">$1</h1>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal text-gray-600 mt-1">$1</li>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-gray-600 mt-1">$1</li>')
    .replace(/\n/g, '<br/>');

  return (
    <div
      className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-xs md:text-sm"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConvId = searchParams.get('conversationId');

  // Layout States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isLightMode } = useTheme();

  // Chat Data States
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(initialConvId || null);
  const [messages, setMessages] = useState([]);
  const [title, setTitle] = useState('New Chat');
  const [inputMessage, setInputMessage] = useState('');
  
  // UI States
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // ── Fetch Conversations List ────────────────────────────────
  const fetchConversations = async () => {
    try {
      const response = await api.get('/ai/conversations');
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── Fetch Single Conversation Messages ───────────────────────
  const fetchMessages = async (id) => {
    setLoadingChat(true);
    setErrorMessage(null);
    try {
      const response = await api.get(`/ai/conversations/${id}`);
      const conv = response.data.conversation;
      setMessages(conv.messages || []);
      setTitle(conv.title || 'Wellness Chat');
      setActiveConversationId(id);
      setSearchParams({ conversationId: id });
    } catch (err) {
      console.error('Failed to fetch chat details:', err);
      setErrorMessage('Could not retrieve conversation messages.');
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (initialConvId) {
      fetchMessages(initialConvId);
    } else {
      setMessages([]);
      setTitle('New Chat');
      setActiveConversationId(null);
    }
  }, [initialConvId]);

  // ── Auto Scroll Handler ──────────────────────────────────────
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom();
    }
  }, [messages, loadingChat]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setIsScrolledUp(isUp);
  };

  // ── Send Message ─────────────────────────────────────────────
  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loadingChat) return;

    setErrorMessage(null);
    setInputMessage('');
    setIsScrolledUp(false);

    // Optimistic UI update: append user message immediately
    const tempUserMsg = { role: 'user', content: textToSend, _id: `temp_${Date.now()}` };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoadingChat(true);

    try {
      const response = await api.post('/ai/chat', {
        message: textToSend,
        conversationId: activeConversationId
      });

      const data = response.data;
      setMessages(data.messages);
      setTitle(data.title);
      
      if (!activeConversationId) {
        setActiveConversationId(data.conversationId);
        setSearchParams({ conversationId: data.conversationId });
        await fetchConversations();
      } else {
        fetchConversations();
      }
    } catch (err) {
      console.error('Chat submission failure:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to get a response from the AI assistant.');
      setMessages((prev) => prev.filter((m) => m._id !== tempUserMsg._id));
    } finally {
      setLoadingChat(false);
    }
  };

  // ── Regenerate Last Response ─────────────────────────────────
  const handleRegenerateResponse = async () => {
    if (messages.length < 2 || loadingChat) return;
    
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) return;
    
    const lastUserText = userMessages[userMessages.length - 1].content;
    
    setMessages((prev) => prev.slice(0, -1));
    setLoadingChat(true);
    
    try {
      const response = await api.post('/ai/chat', {
        message: lastUserText,
        conversationId: activeConversationId
      });
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Regenerate failure:', err);
      setErrorMessage('Could not regenerate the last response.');
      fetchMessages(activeConversationId);
    } finally {
      setLoadingChat(false);
    }
  };

  // ── Delete Conversation ──────────────────────────────────────
  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation session?')) return;

    try {
      await api.delete(`/ai/conversations/${id}`);
      await fetchConversations();
      if (activeConversationId === id) {
        setMessages([]);
        setTitle('New Chat');
        setActiveConversationId(null);
        setSearchParams({});
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Could not delete conversation.');
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setTitle('New Chat');
    setActiveConversationId(null);
    setSearchParams({});
  };

  const handleCopyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleExportConversation = () => {
    if (messages.length === 0) return;

    let doc = `# MindCare AI Discussion - ${title}\n\n`;
    messages.forEach((msg) => {
      const roleStr = msg.role === 'user' ? '### User' : '### MindCare AI Wellness Assistant';
      doc += `${roleStr}\n\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([doc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_discussion.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FCFBFF] text-[#1F1F2E] flex font-poppins">
      
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        sidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Navigation header bar */}
        <TopNav
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 flex overflow-hidden h-[calc(100vh-65px)] relative">
          
          {/* Middle Column: Conversation history panel */}
          <div className="hidden lg:flex flex-col w-76 border-r border-[#EDE8FF] bg-white shrink-0 select-none shadow-sm shadow-[#EDE8FF]/50 p-4 space-y-4">
            
            {/* New Session Button */}
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#7C5CFF]/8 hover:bg-[#7C5CFF]/15 text-[#7C5CFF] font-bold text-xs tracking-wider uppercase shadow-sm transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> New Session
            </button>

            {/* Search sessions */}
            <div className="relative">
              <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 w-4 h-4 my-auto" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="bg-[#FAFAFC] border border-[#EDE8FF] rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-450 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] w-full transition-all"
              />
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
              {loadingHistory ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-11 rounded-2xl bg-gray-50 border border-gray-100" />
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((c) => {
                  const isActive = activeConversationId === c._id;
                  return (
                    <div
                      key={c._id}
                      onClick={() => fetchMessages(c._id)}
                      className={`group flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-[#7C5CFF]/8 border-[#7C5CFF]/20 text-[#7C5CFF] font-bold'
                          : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-[#FAFAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                        <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#7C5CFF]' : 'text-gray-450'}`} />
                        <span className="text-xs truncate">{c.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(c._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all shrink-0"
                        aria-label="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 flex flex-col items-center text-center space-y-3 mt-12">
                  <MessageSquare className="w-10 h-10 text-purple-200" />
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">
                    No conversation history
                  </span>
                  <p className="text-[10px] text-gray-400 font-medium px-2 leading-relaxed">
                    Your conversations with AI Copilot will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main AI Section */}
          <div className="flex-1 flex flex-col justify-between bg-[#FCFBFF] h-full overflow-hidden">
            
            {/* Top Info Bar */}
            <div className="px-6 py-4 border-b border-[#EDE8FF] bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-[#7C5CFF] to-[#A78BFA] flex items-center justify-center shadow-md shadow-[#7C5CFF]/15">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-extrabold text-gray-900 block truncate">{title}</h4>
                  <span className="text-[9px] text-[#7C5CFF] font-bold block uppercase tracking-wider">AI Wellness Copilot</span>
                </div>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={handleExportConversation}
                  className="flex items-center gap-1.5 py-2 px-4 border border-[#EDE8FF] bg-white hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Export Markdown
                </button>
              )}
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="px-6 py-3.5 bg-rose-50 border-b border-rose-100 text-rose-500 text-xs font-semibold text-left flex items-center gap-2 shrink-0">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0" /> {errorMessage}
              </div>
            )}

            {/* Messages Feed */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin"
            >
              {messages.length === 0 && !loadingChat ? (
                /* Empty Feed State / Suggested prompts */
                <div className="max-w-2xl mx-auto py-8 md:py-12 flex flex-col justify-center items-center text-center space-y-8 h-full">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-15 h-15 rounded-2xl bg-gradient-to-tr from-[#7C5CFF] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-[#7C5CFF]/20"
                  >
                    <Brain className="w-7.5 h-7.5 text-white" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">AI Wellness Copilot</h3>
                    <p className="text-gray-500 text-xs md:text-sm max-w-md font-semibold leading-relaxed">
                      Ask me mindfulness questions, request deep-breathing cycles guides, or check in on your 7-day emotional analytics reports.
                    </p>
                  </div>

                  {/* Suggestion Prompt Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl text-left">
                    {SUGGESTED_QUESTIONS.map((q, idx) => {
                      const IconComponent = q.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q.text)}
                          className="p-4 rounded-[20px] border border-[#EDE8FF] bg-white hover:border-[#7C5CFF]/50 text-gray-700 hover:text-[#7C5CFF] text-xs font-bold leading-relaxed transition-all shadow-sm shadow-[#EDE8FF]/20 flex items-start justify-between gap-3 group hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#7C5CFF]/8 flex items-center justify-center text-[#7C5CFF] shrink-0">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <span>{q.text}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Clinical Disclaimer */}
                  <div className="p-5 border border-purple-100 bg-[#7C5CFF]/3 rounded-3xl max-w-xl text-gray-500 text-xxs flex items-start gap-3.5 leading-relaxed shadow-sm shadow-purple-50/10 text-left font-medium">
                    <Info className="w-5.5 h-5.5 text-[#7C5CFF] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-gray-800 block mb-1">Corporate Support Gating Notice</span>
                      This tool is an automated wellness coach providing CBT-inspired guidelines. It does not replace professional therapy. If experiencing critical stress or burnout, please consult qualified corporate psychological care.
                    </div>
                  </div>
                </div>
              ) : (
                /* Chat Feed Messages list */
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.map((msg, index) => {
                    const isAI = msg.role === 'assistant';
                    return (
                      <motion.div
                        key={msg._id || index}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 ${isAI ? 'justify-start' : 'justify-end'}`}
                      >
                        {isAI && (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#A78BFA] flex items-center justify-center shrink-0 text-white shadow-md shadow-[#7C5CFF]/15">
                            <Brain className="w-4.5 h-4.5" />
                          </div>
                        )}

                        <div className={`relative max-w-[85%] rounded-[24px] p-5 border text-left flex flex-col gap-3 shadow-sm ${
                          isAI
                            ? 'bg-white border-[#EDE8FF] text-gray-800'
                            : 'bg-[#7C5CFF]/5 border-[#7C5CFF]/15 text-gray-900 rounded-tr-none'
                        }`}>
                          <MarkdownRenderer content={msg.content} />

                          {/* Message actions (only for AI) */}
                          {isAI && (
                            <div className="flex justify-between items-center border-t border-gray-100 pt-3.5 mt-1 select-none">
                              <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">MindCare Assistant</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleCopyMessage(msg.content, index)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#7C5CFF] hover:bg-[#7C5CFF]/5 transition-all"
                                  title="Copy response"
                                >
                                  {copiedIndex === index ? (
                                    <Check className="w-3.5 h-3.5 text-[#7C5CFF]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                {index === messages.length - 1 && (
                                  <button
                                    onClick={handleRegenerateResponse}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#7C5CFF] hover:bg-[#7C5CFF]/5 transition-all"
                                    title="Regenerate response"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {!isAI && (
                          <div className="w-9 h-9 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 flex items-center justify-center shrink-0 text-[#7C5CFF] font-extrabold text-xs uppercase shadow">
                            {(user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Typing Loader Indicator */}
                  {loadingChat && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-4 justify-start"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#EDE8FF] flex items-center justify-center shrink-0 text-gray-400 animate-pulse">
                        <Brain className="w-4.5 h-4.5" />
                      </div>
                      <div className="bg-white border border-[#EDE8FF] rounded-[24px] p-5 text-gray-500 flex items-center gap-2.5 shadow-sm">
                        <div className="flex space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#7C5CFF]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-[#7C5CFF]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-[#7C5CFF]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 ml-1">Analyzing journals & moods...</span>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Message Container */}
            <div className="p-4 border-t border-[#EDE8FF] bg-white shrink-0 relative">
              
              {/* Floating scroll down button */}
              {isScrolledUp && (
                <button
                  onClick={scrollToBottom}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 p-2 bg-[#7C5CFF] text-white rounded-full shadow-lg hover:scale-105 hover:bg-[#6D4AE5] transition-all flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider px-3.5 py-1.5"
                >
                  <ArrowDown className="w-3.5 h-3.5" /> Recent Messages
                </button>
              )}

              <div className="max-w-3xl mx-auto flex items-center gap-3">
                {/* Attachment paperclip */}
                <button
                  onClick={() => alert("📎 Attachment system: PDF journals and wellness charts upload will launch shortly.")}
                  className="w-12 h-12 rounded-full border border-[#EDE8FF] hover:border-[#7C5CFF]/40 flex items-center justify-center shrink-0 text-gray-400 hover:text-[#7C5CFF] transition-colors bg-[#FAFAFC]"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  disabled={loadingChat}
                  placeholder="Type a wellness question or coping request..."
                  className="bg-[#FAFAFC] border border-[#EDE8FF] rounded-full px-5 py-3.5 text-xs md:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] w-full transition-all flex-1 font-semibold"
                />
                
                {/* Paper plane Send */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loadingChat || !inputMessage.trim()}
                  className="w-12 h-12 rounded-full bg-[#7C5CFF] hover:bg-[#6D4AE5] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center shrink-0 shadow-md shadow-[#7C5CFF]/15 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
