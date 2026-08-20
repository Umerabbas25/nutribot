import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { Flame, Droplets, Beef, Wheat, Coffee, MessageSquare, Mail, Loader2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [todayData, setTodayData] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const phone = localStorage.getItem('userPhone');
      if (!phone) { navigate('/'); return; }

      try {
        const userRes = await api.get(`/users/${phone}`);
        setUser(userRes.data);
        const [todayRes, gamificationRes] = await Promise.all([
          api.get(`/nutrition/${userRes.data.id}/today`),
          api.get(`/nutrition/${userRes.data.id}/gamification`)
        ]);
        setTodayData(todayRes.data);
        setGamification(gamificationRes.data);
      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading your dashboard...</p>
      </div>
    );
  }

  // API returns: { date, totals: { calories, protein, carbs, fat }, logs }
  const totals   = todayData?.totals || {};
  const calories = totals.calories ?? 0;
  const protein  = totals.protein  ?? 0;
  const carbs    = totals.carbs    ?? 0;
  const fat      = totals.fat      ?? 0;
  const logs     = todayData?.logs  || [];

  const calColor = calories > user.dailyCalorieTarget ? '#ef4444' : 'var(--color-primary)';

  const macroData = [
    { name: 'Protein', value: protein || 0.001, color: '#3b82f6' },
    { name: 'Carbs',   value: carbs   || 0.001, color: '#f59e0b' },
    { name: 'Fats',    value: fat     || 0.001, color: '#ef4444' },
  ];

  const handleEmailSummary = async () => {
    try {
      setEmailing(true);
      await api.post(`/nutrition/${user.id}/email-summary`);
      alert('Email sent successfully! Check your inbox.');
    } catch (error) {
      console.error(error);
      alert('Failed to send email. Please try again later.');
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 2rem 4rem' }}>

      {/* ── Header ── */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>Welcome back, {user.name}! 👋</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>Here is your nutrition summary for today.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={handleEmailSummary}
            disabled={emailing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 600,
              background: emailing ? '#475569' : '#3b82f6',
              color: 'white', border: 'none', cursor: emailing ? 'not-allowed' : 'pointer',
              boxShadow: emailing ? 'none' : '0 4px 14px rgba(59,130,246,0.4)',
              transition: 'all 0.2s',
            }}
          >
            {emailing ? <Loader2 size={18} className="spin" /> : <Mail size={18} />}
            {emailing ? 'Sending...' : 'Email Summary'}
          </button>
          <Link
            to="/chat"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 600,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
            }}
          >
            <MessageSquare size={18} /> Chat with NutriBot
          </Link>
          <WhatsAppButton link={localStorage.getItem('whatsappLink') || ''} />
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard title="Calories Consumed" value={`${Math.round(calories)} / ${user.dailyCalorieTarget ?? 0}`} subtitle="kcal" icon={<Flame size={24} />} color={calColor} />
        <StatCard title="Protein" value={`${Math.round(protein)}g`} subtitle={`Target: ~${user.proteinGrams ?? 0}g`} icon={<Beef size={24} />} color="#3b82f6" />
        <StatCard title="Carbs"   value={`${Math.round(carbs)}g`}   subtitle={`Target: ~${user.carbsGrams  ?? 0}g`} icon={<Wheat size={24} />} color="#f59e0b" />
        <StatCard title="Fats"    value={`${Math.round(fat)}g`}     subtitle={`Target: ~${user.fatGrams    ?? 0}g`} icon={<Droplets size={24} />} color="#ef4444" />
      </div>

      {/* ── Gamification Section ── */}
      {gamification && (
        <div className="card" style={{ marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔥</span> Streaks & Badges
          </h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {/* Current Streak */}
            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(245, 158, 11, 0.2)', minWidth: '160px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{gamification.currentStreak}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#b45309', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Day Streak</div>
            </div>

            {/* Badges Grid */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {gamification.badges?.map((badge: any) => (
                <div 
                  key={badge.id}
                  style={{
                    padding: '1rem', borderRadius: 'var(--radius-md)',
                    background: badge.achieved ? 'var(--color-bg)' : 'var(--color-bg-alt)',
                    border: badge.achieved ? '1px solid var(--color-primary-light)' : '1px solid transparent',
                    opacity: badge.achieved ? 1 : 0.6,
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    transition: 'transform 0.2s',
                  }}
                  title={badge.description}
                >
                  <div style={{ fontSize: '2rem', filter: badge.achieved ? 'none' : 'grayscale(100%)' }}>
                    {badge.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: badge.achieved ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>{badge.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Charts + Meals ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>

        {/* Macro Pie */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Macronutrient Breakdown</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={macroData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip formatter={(v: any) => `${v < 0.01 ? 0 : Math.round(Number(v))}g`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-center" style={{ gap: '2rem', marginTop: '1rem' }}>
            {macroData.map(m => (
              <div key={m.name} className="flex-center" style={{ gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: m.color }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Meals Log */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Today's Meals</h3>
          {logs && logs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
              {logs.map((log: any) => (
                <div key={log.id} style={{ padding: '0.875rem 1rem', border: '1px solid rgba(100,116,139,0.1)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600 }}>{log.mealDescription}</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{Math.round(log.calories ?? 0)} kcal</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1rem' }}>
                    <span>P: {Math.round(log.protein ?? 0)}g</span>
                    <span>C: {Math.round(log.carbs   ?? 0)}g</span>
                    <span>F: {Math.round(log.fat     ?? 0)}g</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-center" style={{ flexDirection: 'column', height: '200px', color: 'var(--color-text-muted)' }}>
              <Coffee size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 500 }}>No meals logged yet today.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Use the NutriBot chat to log a meal!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
