'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { 
  Send, 
  Bot, 
  User, 
  ChevronRight,
  ChevronLeft,
  Gauge,
  Package,
  Wrench,
  Zap,
  Trophy,
  Sparkles,
  ArrowDown,
  MessageSquare
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type View = 'home' | 'chat';

const quickActions = [
  { 
    icon: Gauge, 
    label: 'Find my perfect rig',
    description: 'Get personalized recommendations',
    prompt: "I'm looking for a sim racing rig. Can you help me choose the right one?",
  },
  { 
    icon: Zap, 
    label: 'Check compatibility',
    description: 'Verify your gear works',
    prompt: "I have a Fanatec DD2 and Heusinkveld Sprint pedals. What rig works best?",
  },
  { 
    icon: Package, 
    label: 'Track my order',
    description: 'Get shipping updates',
    prompt: "I'd like to check on my order status",
  },
  { 
    icon: Wrench, 
    label: 'Assembly help',
    description: 'Troubleshoot issues',
    prompt: "I'm having trouble with assembly",
  },
];

const popularRigs = [
  { name: 'TR80S', price: '$499', tag: 'Entry' },
  { name: 'TR120S', price: '$719', tag: 'Popular' },
  { name: 'TR160', price: '$879', tag: 'Pro' },
  { name: 'TR8 Pro', price: '$699', tag: 'Premium' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function Home() {
  const [view, setView] = useState<View>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  
  const homeRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Navigate to chat with animation
  const navigateToChat = useCallback((prompt?: string) => {
    if (prompt) setPendingPrompt(prompt);
    
    // Animate home out, chat in
    const tl = gsap.timeline({
      onComplete: () => setView('chat')
    });
    
    if (homeRef.current) {
      tl.to(homeRef.current, {
        x: '-30%',
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
      });
    }
  }, []);

  // Navigate back to home
  const navigateToHome = useCallback(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setView('home');
        setMessages([]);
      }
    });
    
    if (chatRef.current) {
      tl.to(chatRef.current, {
        x: '30%',
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
      });
    }
  }, []);

  // Animate view on change
  useEffect(() => {
    if (view === 'chat' && chatRef.current) {
      gsap.fromTo(chatRef.current,
        { x: '30%', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
      setTimeout(() => inputRef.current?.focus(), 400);
    }
    
    if (view === 'home' && homeRef.current) {
      gsap.fromTo(homeRef.current,
        { x: '-30%', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [view]);

  // Send pending prompt after navigation
  useEffect(() => {
    if (view === 'chat' && pendingPrompt) {
      const prompt = pendingPrompt;
      setPendingPrompt(null);
      setTimeout(() => sendMessage(prompt), 500);
    }
  }, [view, pendingPrompt]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: data.response || "I'm having connection issues. Please try again.",
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: "Connection error. Please try again or contact support@trakracer.com",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--tr-red)]/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* HOME VIEW */}
      {view === 'home' && (
        <div ref={homeRef} className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="nav-header">
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
              <Image 
                src="/trakracer-logo-full.png" 
                alt="Trak Racer" 
                width={120} 
                height={32}
                className="h-6 w-auto"
                priority
              />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] text-[var(--text-tertiary)]">Online</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col pt-20 pb-8 px-4 max-w-3xl mx-auto w-full">
            {/* Hero */}
            <div className="text-center mb-10 pt-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--tr-red)]/10 border border-[var(--tr-red)]/20 mb-6">
                <Trophy className="w-3.5 h-3.5 text-[var(--tr-red)]" />
                <span className="text-xs font-semibold text-[var(--tr-red)]">Official Alpine F1 Team Partner</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
                How can I help you?
              </h1>
              <p className="text-[var(--text-secondary)] text-base max-w-md mx-auto">
                Expert advice on rigs, compatibility, orders, and assembly support.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigateToChat(action.prompt)}
                  className="card card-interactive group flex items-start gap-4 p-4 text-left"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--tr-red)] to-[var(--tr-red-dark)] shadow-lg shadow-[var(--tr-red)]/20">
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{action.label}</span>
                      <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:text-[var(--tr-red)] group-hover:translate-x-1 transition-all" />
                    </div>
                    <span className="text-sm text-[var(--text-tertiary)]">{action.description}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Features */}
            <div className="flex justify-center gap-6 mb-10">
              {[
                { icon: Trophy, label: 'F1 Partner' },
                { icon: Sparkles, label: 'AI Powered' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                  <f.icon className="w-4 h-4 text-[var(--tr-red)]" />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            {/* Popular Rigs */}
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                Popular Rigs
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {popularRigs.map((rig, i) => (
                  <button
                    key={i}
                    onClick={() => navigateToChat(`Tell me about the ${rig.name} rig`)}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-elevated)] border border-[var(--glass-border)] hover:border-[var(--tr-red)]/30 transition-all text-left group"
                  >
                    <div className="text-[10px] font-semibold text-[var(--tr-red)] uppercase">{rig.tag}</div>
                    <div className="font-bold text-[var(--text-primary)]">{rig.name}</div>
                    <div className="text-sm text-[var(--text-tertiary)]">{rig.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Chat Button */}
            <div className="mt-auto pt-8 text-center">
              <button
                onClick={() => navigateToChat()}
                className="btn-primary px-6 py-3 inline-flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Start a Conversation
              </button>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-[var(--glass-border)] py-4 bg-[var(--bg-primary)]">
            <div className="max-w-3xl mx-auto px-4 flex justify-between text-[11px] text-[var(--text-quaternary)]">
              <span>© 2026 Trak Racer</span>
              <div className="flex gap-4">
                <a href="https://trakracer.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--tr-red)]">Shop</a>
                <a href="https://trakracer.com/pages/assembly-manuals" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--tr-red)]">Manuals</a>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* CHAT VIEW */}
      {view === 'chat' && (
        <div ref={chatRef} className="min-h-screen flex flex-col">
          {/* Header with Back */}
          <header className="nav-header">
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
              <button onClick={navigateToHome} className="nav-back">
                <ChevronLeft className="w-5 h-5" />
                <span>Home</span>
              </button>
              <span className="nav-title">Support Chat</span>
              <div className="w-[72px]" /> {/* Spacer for centering */}
            </div>
          </header>

          {/* Messages */}
          <main className="flex-1 overflow-y-auto pt-16 pb-24 px-4">
            <div className="max-w-3xl mx-auto space-y-4 py-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-12 animate-fade-in-up">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--tr-red)] to-[var(--tr-red-dark)] flex items-center justify-center shadow-lg shadow-[var(--tr-red)]/20">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    Trak Racer Support
                  </h2>
                  <p className="text-[var(--text-tertiary)] max-w-sm mx-auto">
                    Ask me anything about rigs, compatibility, orders, or assembly.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${
                    message.role === 'user' ? 'animate-slide-in-right' : 'animate-slide-in-left'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="avatar avatar-bot w-8 h-8">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`message-bubble max-w-[80%] px-4 py-3 ${
                    message.role === 'user' ? 'message-user' : 'message-assistant'
                  }`}>
                    <p className="text-[15px] leading-relaxed text-white whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="avatar avatar-user w-8 h-8">
                      <User className="w-4 h-4 text-[var(--text-secondary)]" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 animate-slide-in-left">
                  <div className="avatar avatar-bot w-8 h-8">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="message-bubble message-assistant px-4 py-3">
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </main>

          {/* Input */}
          <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)] border-t border-[var(--glass-border)] p-4">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="max-w-3xl mx-auto"
            >
              <div className="input-container flex gap-2 p-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="input-field flex-1 px-4 py-2.5"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="btn-primary px-5 py-2.5 flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
