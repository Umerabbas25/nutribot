import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Send, ArrowLeft, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const SUGGESTIONS = [
  'I had a banana and coffee for breakfast',
  'Lunch was biryani with raita',
  'Show my today\'s progress',
  'I ate 2 rotis with daal',
];

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const phone = localStorage.getItem('userPhone');
    if (!phone) { navigate('/'); return; }

    api.get(`/users/${phone}`)
      .then(res => {
        setUser(res.data);
        setMessages([{
          id: 'welcome',
          text: `Hi ${res.data.name}! 👋 I'm NutriBot, your AI nutrition assistant.\n\nTell me what you ate and I'll log it and give you insights. You can also type *today*, *profile*, or *help*!`,
          sender: 'bot',
          timestamp: new Date(),
        }]);
      })
      .catch(() => navigate('/'))
      .finally(() => setInitializing(false));
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    inputRef.current?.focus();

    try {
      const response = await api.post('/chat', {
        phone: user.phoneNumber,
        message: text.trim(),
      });

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: response.data.reply,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Sorry, something went wrong. Please try again.';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: `❌ ${errMsg}`,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    if (!user) return;
    setMessages([{
      id: 'welcome-reset',
      text: `Chat cleared! Ready to log your next meal, ${user.name}? 🍽️`,
      sender: 'bot',
      timestamp: new Date(),
    }]);
  };

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Render markdown-like bold *text* as <strong>
  const renderText = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) =>
      part.startsWith('*') && part.endsWith('*')
        ? <strong key={i}>{part.slice(1, -1)}</strong>
        : part
    );
  };

  if (initializing) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Starting NutriBot...</p>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>

      {/* ── Chat Header ── */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 20px rgba(16,185,129,0.3)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </Link>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <Bot size={24} color="white" />
          </div>
          <div>
            <h2 style={{ color: 'white', fontSize: '1.1rem', margin: 0 }}>NutriBot AI</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#86efac', boxShadow: '0 0 6px #86efac' }} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>Online • Your AI dietician</span>
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          title="Clear chat"
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* ── Messages Area ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.625rem' }}>
            {msg.sender === 'bot' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
                <Sparkles size={15} color="white" />
              </div>
            )}
            <div style={{ maxWidth: '72%' }}>
              <div style={{
                padding: '0.875rem 1.125rem',
                borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.sender === 'user'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'var(--color-surface)',
                color: msg.sender === 'user' ? 'white' : 'var(--color-text-main)',
                border: msg.sender === 'bot' ? '1px solid rgba(100,116,139,0.1)' : 'none',
                boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(16,185,129,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem',
              }}>
                {renderText(msg.text)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', textAlign: msg.sender === 'user' ? 'right' : 'left', paddingInline: '0.25rem' }}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
            {msg.sender === 'user' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface)', border: '2px solid var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={15} color="var(--color-primary)" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.625rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={15} color="white" />
            </div>
            <div style={{ padding: '0.875rem 1.25rem', borderRadius: '18px 18px 18px 4px', background: 'var(--color-surface)', border: '1px solid rgba(100,116,139,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Loader2 size={16} className="animate-spin" color="var(--color-primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Analysing your meal...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggestion Chips ── */}
      {messages.length <= 1 && !isLoading && (
        <div style={{ padding: '0 1.5rem 0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              style={{
                padding: '0.4rem 0.875rem', borderRadius: '9999px', fontSize: '0.8rem',
                background: 'var(--color-surface)', border: '1px solid rgba(16,185,129,0.3)',
                color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Bar ── */}
      <div style={{ padding: '0.875rem 1.5rem 1.25rem', background: 'var(--color-surface)', borderTop: '1px solid rgba(100,116,139,0.1)', flexShrink: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tell me what you ate... (e.g. I had biryani)"
            disabled={isLoading}
            style={{
              flex: 1, padding: '0.875rem 1.25rem',
              borderRadius: '9999px',
              border: '1.5px solid rgba(100,116,139,0.15)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-main)',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={e => e.target.style.borderColor = 'rgba(100,116,139,0.15)'}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            style={{
              width: '48px', height: '48px', borderRadius: '50%', border: 'none',
              background: input.trim() && !isLoading ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(100,116,139,0.2)',
              color: 'white', cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: input.trim() && !isLoading ? '0 4px 12px rgba(16,185,129,0.4)' : 'none',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
