'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  Send, 
  Bot, 
  User, 
  ChevronRight,
  Gauge,
  Package,
  Wrench,
  Zap,
  Trophy,
  Headphones,
  ArrowDown,
  Sparkles,
  Command,
  CornerDownLeft
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickActions = [
  { 
    icon: Gauge, 
    label: 'Find my perfect rig',
    description: 'Get personalized recommendations',
    prompt: "I'm looking for a sim racing rig. Can you help me choose the right one based on my equipment?",
  },
  { 
    icon: Zap, 
    label: 'Check compatibility',
    description: 'Verify your gear works',
    prompt: "I have a Fanatec DD2 wheelbase and Heusinkveld Sprint pedals. What Trak Racer rig would work best?",
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
    prompt: "I'm having trouble with assembly - the bolts won't thread properly",
  },
];

const popularRigs = [
  { name: 'TR80S', price: '$499', tag: 'Entry Level' },
  { name: 'TR120S V2', price: '$719', tag: 'Best Seller' },
  { name: 'TR160 V5', price: '$879', tag: 'Performance' },
  { name: 'TR8 Pro V2', price: '$699', tag: 'Premium' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

// Simple markdown-ish rendering
function formatMessage(content: string): string {
  let formatted = content;
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  formatted = formatted.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-black/20 text-[13px] font-mono">$1</code>');
  formatted = formatted.replace(/^[-•]\s/gm, '<span class="text-[var(--tr-red)] mr-1">•</span>');
  return formatted;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeFading, setWelcomeFading] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus input with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Clear chat with Cmd/Ctrl + Shift + Backspace
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Backspace') {
        e.preventDefault();
        setMessages([]);
        setShowWelcome(true);
        setWelcomeFading(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Fade out welcome when first message sent
  useEffect(() => {
    if (messages.length === 1 && showWelcome) {
      setWelcomeFading(true);
      setTimeout(() => setShowWelcome(false), 300);
    }
  }, [messages.length, showWelcome]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
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

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment, or reach out to support@trakracer.com",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] flex flex-col relative overflow-hidden transition-opacity duration-500 ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--tr-red)]/[0.02] via-transparent to-transparent" />
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--tr-red)]/[0.03] rounded-full blur-[120px]" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(var(--text-quaternary) 1px, transparent 1px), linear-gradient(90deg, var(--text-quaternary) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>
      
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-[var(--glass-border)]">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image 
                  src="/trakracer-logo-full.png" 
                  alt="Trak Racer" 
                  width={140} 
                  height={38}
                  className="h-7 w-auto"
                  priority
                />
              </div>
              <div className="hidden sm:flex items-center gap-2 ml-3">
                <div className="h-4 w-px bg-[var(--glass-border)]" />
                <span className="text-xs font-medium text-[var(--text-tertiary)]">AI Support</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* New Chat Button */}
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    setMessages([]);
                    setShowWelcome(true);
                    setWelcomeFading(false);
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] rounded-lg border border-[var(--glass-border)] transition-all active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Chat
                </button>
              )}
              {/* Keyboard shortcut hint */}
              <div className="hidden md:flex items-center gap-1 text-[10px] text-[var(--text-quaternary)]">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--glass-border)] font-mono">⌘K</kbd>
                <span>focus</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] text-[var(--text-tertiary)]">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto relative">
        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6"
        >
          {/* Welcome Screen */}
          {showWelcome && (
            <div className={`transition-all duration-300 ${welcomeFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              {/* Hero */}
              <div className="text-center mb-10 pt-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--tr-red)]/10 border border-[var(--tr-red)]/20 mb-6 hover:bg-[var(--tr-red)]/15 hover:scale-105 transition-all cursor-default">
                  <Trophy className="w-3.5 h-3.5 text-[var(--tr-red)]" />
                  <span className="text-xs font-semibold text-[var(--tr-red)] tracking-wide">Official Alpine F1 Team Partner</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
                  How can I help you today?
                </h1>
                <p className="text-[var(--text-secondary)] text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                  Expert advice on sim racing rigs, compatibility checks, order tracking, and assembly support.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(action.prompt)}
                    className="card card-interactive group flex items-start gap-4 p-4 text-left opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${200 + i * 100}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--tr-red)] to-[var(--tr-red-dark)] shadow-lg shadow-[var(--tr-red)]/20 group-hover:shadow-[var(--tr-red)]/40 group-hover:scale-110 transition-all duration-300">
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors">{action.label}</span>
                        <ChevronRight className="w-4 h-4 text-[var(--text-quaternary)] group-hover:text-[var(--tr-red)] group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <span className="text-sm text-[var(--text-tertiary)]">{action.description}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Features */}
              <div className="flex flex-wrap justify-center gap-6 mb-10">
                {[
                  { icon: Trophy, label: 'F1 Partnership' },
                  { icon: Sparkles, label: 'AI-Powered' },
                  { icon: Headphones, label: 'Instant Support' },
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
                      onClick={() => sendMessage(`Tell me about the ${rig.name} rig. What's included and who is it best for?`)}
                      className="group p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-elevated)] border border-[var(--glass-border)] hover:border-[var(--tr-red)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left opacity-0 animate-fade-in-up"
                      style={{ animationDelay: `${700 + i * 75}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className="text-[10px] font-semibold text-[var(--tr-red)] uppercase tracking-wider mb-1">
                        {rig.tag}
                      </div>
                      <div className="font-bold text-[var(--text-primary)] group-hover:text-white transition-colors">
                        {rig.name}
                      </div>
                      <div className="text-sm text-[var(--text-tertiary)]">{rig.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {!showWelcome && (
            <div className="space-y-4">
              {/* Conversation start indicator */}
              <div className="flex items-center justify-center gap-3 py-4 animate-fade-in-up">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--glass-border)]" />
                <span className="text-[11px] text-[var(--text-quaternary)] font-medium">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--glass-border)]" />
              </div>
              
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${
                    message.role === 'user' ? 'animate-slide-in-right' : 'animate-slide-in-left'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="avatar avatar-bot w-9 h-9 flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`message-bubble max-w-[85%] sm:max-w-[75%] px-4 py-3 ${
                      message.role === 'user' ? 'message-user' : 'message-assistant'
                    }`}
                  >
                    <div 
                      className="text-[15px] leading-relaxed whitespace-pre-wrap text-white"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                  </div>
                  {message.role === 'user' && (
                    <div className="avatar avatar-user w-9 h-9 flex-shrink-0">
                      <User className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start animate-slide-in-left">
                  <div className="avatar avatar-bot w-9 h-9 flex-shrink-0 animate-pulse-glow">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="message-bubble message-assistant px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                      <span className="text-[13px] text-[var(--text-quaternary)]">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 p-2.5 rounded-full glass shadow-lg hover:bg-[var(--bg-elevated)] active:scale-95 transition-all animate-bounce-in"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        )}

        {/* Input Area */}
        <div className="glass border-t border-[var(--glass-border)] p-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className={`flex gap-2 p-1.5 rounded-2xl transition-all duration-200 ${
              isInputFocused 
                ? 'bg-[var(--bg-tertiary)] ring-2 ring-[var(--tr-red)]/30 shadow-lg shadow-[var(--tr-red)]/5' 
                : 'bg-[var(--bg-tertiary)]'
            }`}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Ask anything about Trak Racer..."
                className="flex-1 px-4 py-3 bg-transparent text-[var(--text-primary)] text-[15px] placeholder:text-[var(--text-quaternary)] focus:outline-none"
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="btn-primary px-5 py-3 flex items-center justify-center gap-2 disabled:opacity-40 group"
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin-smooth" />
                ) : (
                  <>
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="hidden sm:inline text-sm font-medium">Send</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Input hints */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="text-[11px] text-[var(--text-quaternary)]">
                Powered by AI
              </span>
              <span className="text-[11px] text-[var(--text-quaternary)]">·</span>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--text-quaternary)]">
                <CornerDownLeft className="w-3 h-3" />
                <span>to send</span>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[var(--glass-border)] py-4 bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--text-quaternary)]">
          <span className="order-2 sm:order-1">© 2026 Trak Racer · AI Assistant Demo</span>
          <div className="flex items-center gap-5 order-1 sm:order-2">
            <a href="https://trakracer.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--tr-red)] transition-colors font-medium">
              Shop
            </a>
            <a href="https://trakracer.com/pages/assembly-manuals" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--tr-red)] transition-colors font-medium">
              Manuals
            </a>
            <a href="mailto:support@trakracer.com" className="hover:text-[var(--tr-red)] transition-colors font-medium">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
