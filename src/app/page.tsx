'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  ShoppingCart, 
  Package, 
  Wrench,
  HelpCircle,
  ChevronRight,
  Headphones,
  Gauge,
  Trophy,
  Zap
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickActions = [
  { 
    icon: Gauge, 
    label: 'Find my perfect rig',
    prompt: "I'm looking for a sim racing rig. Can you help me choose the right one based on my equipment?",
    color: 'from-red-600 to-red-700'
  },
  { 
    icon: Zap, 
    label: 'Check compatibility',
    prompt: "I have a Fanatec DD2 wheelbase and Heusinkveld Sprint pedals. What Trak Racer rig would work best?",
    color: 'from-orange-600 to-red-600'
  },
  { 
    icon: Package, 
    label: 'Track my order',
    prompt: "I'd like to check on my order status. My order number is TR-12345",
    color: 'from-blue-600 to-blue-700'
  },
  { 
    icon: Wrench, 
    label: 'Assembly help',
    prompt: "I'm having trouble with assembly - the bolts won't thread properly and the T-nuts keep popping out of the channel",
    color: 'from-gray-600 to-gray-700'
  },
];

const features = [
  { icon: Trophy, label: 'Official Alpine F1 Partner', desc: 'Used by professional drivers' },
  { icon: Gauge, label: 'Expert Recommendations', desc: 'AI-powered rig matching' },
  { icon: Headphones, label: '24/7 Support', desc: 'Instant answers to your questions' },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
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
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm experiencing a connection issue. Please try again or contact us at support@trakracer.com",
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

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-tr-gradient flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/trakracer-logo-full.png" 
                alt="Trak Racer" 
                width={160} 
                height={43}
                className="h-8 w-auto"
                priority
              />
              <div className="hidden sm:block h-6 w-px bg-[#3A3A3A]" />
              <span className="hidden sm:block text-sm text-[#606060] font-medium">Support Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-[#606060]">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome Screen */}
          {messages.length === 0 && (
            <div className="py-8 animate-slide-up">
              {/* Hero Section */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E92E2E]/10 border border-[#E92E2E]/20 rounded-full mb-6">
                  <Trophy className="w-4 h-4 text-[#E92E2E]" />
                  <span className="text-sm text-[#E92E2E] font-medium">Official Alpine F1 Team Partner</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  How can we help you today?
                </h1>
                <p className="text-[#606060] max-w-lg mx-auto">
                  Get expert advice on rigs, check compatibility with your gear, 
                  track orders, or troubleshoot assembly issues.
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-10">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="group relative flex items-center gap-4 p-4 bg-[#121212] hover:bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#E92E2E]/30 rounded-xl text-left transition-all duration-200"
                  >
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${action.color}`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-white font-medium flex-1">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#3A3A3A] group-hover:text-[#E92E2E] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              {/* Features */}
              <div className="flex flex-wrap justify-center gap-6 text-center">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[#606060]">
                    <feature.icon className="w-4 h-4 text-[#E92E2E]" />
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>

              {/* Product Highlights */}
              <div className="mt-12 p-6 bg-[#121212] border border-[#1a1a1a] rounded-2xl">
                <h3 className="text-sm font-semibold text-[#606060] uppercase tracking-wider mb-4">Popular Rigs</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { name: 'TR80S', price: '$499', desc: 'Entry Level' },
                    { name: 'TR120S V2', price: '$719', desc: 'Best Seller' },
                    { name: 'TR160 V5', price: '$879', desc: 'High Performance' },
                    { name: 'TR8 Pro V2', price: '$699', desc: 'Premium' },
                  ].map((rig, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(`Tell me about the ${rig.name} rig`)}
                      className="p-3 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#E92E2E]/30 rounded-lg text-left transition-all group"
                    >
                      <div className="text-xs text-[#E92E2E] font-medium mb-1">{rig.desc}</div>
                      <div className="text-white font-semibold">{rig.name}</div>
                      <div className="text-sm text-[#606060]">{rig.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 animate-slide-up ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-[#E92E2E] to-[#DE2330] rounded-lg flex items-center justify-center shadow-lg shadow-[#E92E2E]/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'message-user text-white'
                    : 'message-assistant text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-9 h-9 bg-[#3A3A3A] rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-slide-up">
              <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-[#E92E2E] to-[#DE2330] rounded-lg flex items-center justify-center animate-pulse-red">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="message-assistant rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#E92E2E] animate-spin" />
                  <span className="text-sm text-[#606060]">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-md p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about rigs, compatibility, orders, or assembly..."
                className="flex-1 px-4 py-3 input-tr rounded-xl text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-5 py-3 btn-tr-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-center text-xs text-[#3A3A3A] mt-3">
              Powered by AI • Trained on Trak Racer products & support documentation
            </p>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-4 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[#3A3A3A] text-xs">
            © 2026 Trak Racer • AI Assistant Demo
          </p>
          <div className="flex items-center gap-4 text-xs">
            <a href="https://trakracer.com" target="_blank" rel="noopener noreferrer" className="text-[#606060] hover:text-[#E92E2E] transition-colors">
              Shop
            </a>
            <a href="https://trakracer.com/pages/assembly-manuals" target="_blank" rel="noopener noreferrer" className="text-[#606060] hover:text-[#E92E2E] transition-colors">
              Manuals
            </a>
            <a href="mailto:support@trakracer.com" className="text-[#606060] hover:text-[#E92E2E] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
