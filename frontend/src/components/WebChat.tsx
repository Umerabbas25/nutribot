import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Send, X, MessageSquare, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

interface WebChatProps {
  userPhone: string;
}

export const WebChat: React.FC<WebChatProps> = ({ userPhone }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', text: 'Hi! I am NutriBot. Tell me what you ate!', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userText, sender: 'user' }]);
    setIsLoading(true);

    try {
      const response = await api.post('/chat', {
        phone: userPhone,
        message: userText
      });
      
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: response.data.reply, sender: 'bot' }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: '❌ Sorry, I could not process that. Please try again.', sender: 'bot' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center z-50 animate-bounce"
        style={{ width: '60px', height: '60px' }}
      >
        <MessageSquare size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50" style={{ height: '500px', maxHeight: '80vh' }}>
      {/* Header */}
      <div className="bg-emerald-500 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} />
          <h3 className="font-semibold text-lg">NutriBot Chat</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-emerald-600 p-1 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-emerald-500 text-white rounded-br-none'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm">Analysing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
