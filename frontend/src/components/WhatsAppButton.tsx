import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  link: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ link }) => {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="btn animate-pulse-soft"
      style={{
        backgroundColor: '#25D366', // WhatsApp Green
        color: 'white',
        padding: '1rem 2rem',
        fontSize: '1.125rem',
        boxShadow: '0 10px 25px -5px rgba(37, 211, 102, 0.5)',
      }}
    >
      <MessageCircle size={24} />
      <span>Chat with NutriBot on WhatsApp</span>
    </a>
  );
};
