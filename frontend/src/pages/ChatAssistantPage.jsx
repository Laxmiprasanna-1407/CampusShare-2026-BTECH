import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Package,
  Bot,
  User,
  ExternalLink,
  Info,
} from 'lucide-react';

export function ChatAssistantPage() {
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('campusshare_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chat session', e);
      }
    }
    return [
      {
        id: 'init-1',
        role: 'assistant',
        content:
          "Hello! I am your **CampusShare Assistant**.\n\nI can help you find equipment, textbooks, calculators, and tools available from fellow students on campus.\n\n*Try asking:*\n- *\"Is there a scientific calculator under Rs.30 per day?\"*\n- *\"Do you have any engineering textbooks for CSE?\"*\n- *\"Show me lab equipment available this week.\"*",
        items: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('campusshare_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText = input) => {
    const query = (queryText || '').trim();
    if (!query || loading) return;

    setLastFailedQuery(null);

    const userMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      // Send conversation history to backend for conversational context
      const historyPayload = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await chatApi.sendMessage({
        message: query,
        history: historyPayload,
      });

      const { answer, fallbackNotice, retrievedItems } = res.data;

      const assistantMessage = {
        id: 'reply-' + Date.now(),
        role: 'assistant',
        content: answer,
        fallbackNotice,
        items: retrievedItems || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setLastFailedQuery(query);
      const errorMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content:
          "I'm sorry, but I was unable to connect to the catalog search service or LLM provider right now. Please check your connection and retry.",
        isError: true,
        items: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    sessionStorage.removeItem('campusshare_chat_history');
    setMessages([
      {
        id: 'init-fresh',
        role: 'assistant',
        content:
          'Chat session cleared. How can I help you find campus items today?',
        items: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const promptSuggestions = [
    'Is there a scientific calculator under Rs.30 per day?',
    'Find course books for CSE engineering',
    'Do you have digital multimeters or lab kits?',
    'Looking for a 65W fast laptop charger',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-display">
                CampusShare Assistant
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-100 text-violet-800">
                RAG Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Answers queries strictly from verified active campus item listings
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          title="Clear Conversation"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-indigo-600'
                  : 'bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-sm shadow-violet-200'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                  : msg.isError
                  ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-tl-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
              }`}
            >
              {/* Fallback Notice Banner if present */}
              {msg.fallbackNotice && (
                <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>{msg.fallbackNotice}</span>
                </div>
              )}

              {/* Message Content */}
              <div className="prose prose-sm max-w-none prose-slate">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {/* Attached Retrieved Items */}
              {msg.items && msg.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Relevant Campus Listings Found:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {msg.items.map((it) => (
                      <Link
                        key={it.id}
                        to={`/items/${it.id}`}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition flex items-center gap-3 group"
                      >
                        <img
                          src={
                            it.imageUrl ||
                            'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=100&q=80'
                          }
                          alt={it.title}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition truncate">
                            {it.title}
                          </p>
                          <p className="text-[11px] font-extrabold text-indigo-600">
                            ₹{it.dailyPrice} <span className="text-slate-400 font-normal">/day</span>
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {it.categoryName} • Owner: {it.owner?.name?.split(' ')[0]}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Retry Option */}
              {msg.isError && lastFailedQuery && (
                <div className="mt-3">
                  <button
                    onClick={() => handleSend(lastFailedQuery)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Query
                  </button>
                </div>
              )}

              <div
                className={`text-[10px] mt-2 text-right ${
                  msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-2xs flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Searching campus database and consulting Assistant...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length <= 2 && (
        <div className="pb-3 flex flex-wrap gap-2">
          {promptSuggestions.map((text, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(text)}
              className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-full text-xs font-medium transition shadow-2xs"
            >
              "{text}"
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="pt-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about calculators, textbooks, lab equipment, or chargers..."
            className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Send message"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          CampusShare AI Assistant uses Database RAG to ground answers in real campus listings.
        </p>
      </form>
    </div>
  );
}
