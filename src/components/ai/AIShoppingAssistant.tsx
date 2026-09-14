import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { MiniProductCard } from './MiniProductCard';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const QUICK_REPLIES = [
  "Compare with Ryzen 5",
  "Is this in stock?",
  "Show me budget options",
  "Best GPU under 150k"
];

// Helper to parse product tags from AI response
const renderMessageWithProducts = (text: string) => {
  const parts = text.split(/(\[PRODUCT:[^\]]+\])/g);
  
  return parts.map((part, index) => {
    const match = part.match(/\[PRODUCT:\s*([^\]]+)\]/);
    if (match) {
      return <MiniProductCard key={index} sku={match[1]} />;
    }
    // Return standard text if it's not a tag
    return <ReactMarkdown key={index}>{part}</ReactMarkdown>;
  });
};

export function AIShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(QUICK_REPLIES);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') {
      e.preventDefault();
    }
    
    const userText = typeof e === 'string' ? e : input.trim();
    if (!userText || isLoading) return;
    
    setInput('');
    
    // Add user message to UI
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // Simulate backend AI response for demo purposes (usually this hits an API)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.map(m => ({ role: m.role, text: m.text }))
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      const newAIMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: data.text };
      setMessages(prev => [...prev, newAIMsg]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mocked AI Response for Storefront Demo
      setTimeout(() => {
        let mockResponse = "I can definitely help with that. Are you looking for specific performance metrics?";
        
        if (userText.toLowerCase().includes("budget")) {
           mockResponse = "For a budget build, I highly recommend checking out these options. They offer great price-to-performance ratios. [PRODUCT: INTEL-I5-12400F] Let me know if you need a motherboard to pair with it!";
        } else if (userText.toLowerCase().includes("stock") || userText.toLowerCase().includes("compare")) {
           mockResponse = "Yes, we have high-end GPUs in stock right now. Here is one of our top sellers. [PRODUCT: ASUS-TUF-RTX3060TI]";
        }
        
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: mockResponse 
        }]);
        setIsLoading(false);
      }, 1000);
      
    } finally {
      // setTimeout handles isLoading in the catch block for the mock, 
      // but if we used a real API we'd set it here.
    }
  };

  const handleQuickReply = (text: string) => {
    handleSubmit(text);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[350px] sm:w-[420px] h-[550px] max-h-[80vh] bg-[#0A0A0C] border border-white/10 flex flex-col mb-4 overflow-hidden shadow-2xl rounded-none relative" 
          >
            {/* Header */}
            <div className="bg-[#121215] px-4 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E50914] rounded-none flex items-center justify-center border border-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.3)]">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-widest uppercase">SUNX Logic Core</h3>
                  <p className="text-xs text-gray-500 font-mono">Status: Online</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-[#0A0A0C]">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 opacity-50 mt-10">
                  <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-4">
                     <Bot className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-400 max-w-[250px]">Initialize query. I can analyze specs, verify compatibility, and execute product searches.</p>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className={`px-5 py-3 shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-[#1a1a1f] text-white border border-white/5 rounded-2xl rounded-br-none' 
                      : 'bg-[#121215]/90 backdrop-blur-md border border-white/5 rounded-2xl rounded-bl-none'
                  }`}>
                    <div className={`text-sm md:text-base leading-relaxed tracking-wide ${msg.role === 'user' ? 'text-white font-medium' : 'text-slate-300 prose prose-invert prose-sm'}`}>
                      {msg.role === 'model' ? renderMessageWithProducts(msg.text) : msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="self-start max-w-[85%]"
                >
                  <div className="px-5 py-4 bg-[#121215]/90 backdrop-blur-md border border-white/5 rounded-2xl rounded-bl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" />
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">Processing...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Quick Replies */}
            <div className="px-4 py-3 bg-[#0A0A0C] border-t border-white/5 overflow-x-auto whitespace-nowrap flex gap-2 hide-scrollbar">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(sug)}
                  disabled={isLoading}
                  className="inline-block px-4 py-2 text-xs text-slate-400 border border-white/10 rounded-full hover:text-white hover:border-[#E50914] hover:bg-[#E50914]/10 transition-all disabled:opacity-50"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#121215] border-t border-white/5">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Input query..."
                  className="w-full bg-[#0A0A0C] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#E50914] transition-colors pr-12 rounded-none placeholder-gray-600 font-mono"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 text-gray-500 hover:text-[#E50914] disabled:opacity-50 disabled:hover:text-gray-500 transition-colors p-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#E50914] hover:bg-red-700 text-white flex items-center justify-center shadow-[0_0_15px_rgba(229,9,20,0.4)] rounded-none transition-colors border border-[#E50914]"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 fill-current" />}
      </motion.button>
    </div>
  );
}
