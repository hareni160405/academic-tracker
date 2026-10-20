import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { ChatMessage, Conversation } from '../types';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Plus,
  MessageSquare,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [includeWeakTopics, setIncludeWeakTopics] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
        setMessages(data[0].messages || []);
      }
    } catch (err) {
      console.log('[Assistant] Error fetching conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConvId(conv.id);
    setMessages(conv.messages || []);
  };

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const reply = await api.sendChatMessage(
        userText,
        activeConvId || undefined,
        includeWeakTopics
      );
      setMessages((prev) => [...prev, reply]);
      loadConversations();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: `Error: ${err.message || 'Unable to connect to AI study assistant. Please try again.'}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 pb-16 md:h-[calc(100vh-6.5rem)] md:flex-row md:pb-0">
      {/* Sidebar of Conversations */}
      <div className="hidden w-64 flex-col rounded-2xl border border-slate-800 bg-slate-900 p-4 md:flex">
        <button
          onClick={handleNewConversation}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          <span>New Discussion</span>
        </button>

        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Recent Discussions
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">No past conversations.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectConversation(c)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                  activeConvId === c.id
                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            ))
          )}
        </div>

        {/* Weak Topic Context Toggle */}
        <div className="border-t border-slate-800 pt-3">
          <label className="flex cursor-pointer items-center justify-between text-[11px] text-slate-400">
            <span>Include weak-topic context</span>
            <input
              type="checkbox"
              checked={includeWeakTopics}
              onChange={(e) => setIncludeWeakTopics(e.target.checked)}
              className="accent-indigo-600"
            />
          </label>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">AI Study Assistant & Tutor</div>
              <div className="text-[11px] text-slate-400">
                Concepts, derivations, problem breakdowns & exam prep
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewConversation}
              className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-white md:hidden"
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">How can I help you study today?</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Ask me to explain difficult theorems, solve math problems step-by-step, or generate summaries for upcoming tests.
              </p>

              {/* Starter Prompt Cards */}
              <div className="mt-6 grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  'Explain Dijkstra’s algorithm step-by-step',
                  'Summarize key principles of Operating System Deadlocks',
                  'Create a 3-step revision plan for my weak topics',
                  'Explain the central limit theorem with an example',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputMessage(prompt);
                    }}
                    className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-left text-xs text-slate-300 transition-colors hover:border-indigo-500/50 hover:text-white"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed md:max-w-[75%] ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'border border-slate-800 bg-slate-950 text-slate-200 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div
                    className={`mt-2 text-[10px] ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.sender === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400">
                Thinking and preparing step-by-step academic response...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask an academic question or request a topic summary..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
