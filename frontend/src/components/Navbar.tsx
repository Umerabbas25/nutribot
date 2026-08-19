import React from 'react';
import { Leaf, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Trigger re-render on navigation
  const isLoggedIn = !!localStorage.getItem('userPhone');

  const handleLogout = () => {
    localStorage.removeItem('userPhone');
    navigate('/');
  };

  return (
    <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '1rem 0' }}>
      <div className="container flex-between">
        <Link to="/" className="flex-center" style={{ gap: '0.75rem' }}>
          <div style={{
            background: 'var(--color-primary)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            display: 'flex'
          }}>
            <Leaf size={24} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            NutriBot
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>Home</Link>
          {isLoggedIn && (
            <>
              <Link to="/dashboard" style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>Dashboard</Link>
              <Link to="/trends" style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>Trends</Link>
              <button 
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer',
                  padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)',
                  fontWeight: 600, color: '#ef4444', transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              >
                <LogOut size={16} /> Log Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
