import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { Activity, CalendarDays, TrendingUp } from 'lucide-react';

export const TrendsPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const phone = localStorage.getItem('userPhone');
      if (!phone) { navigate('/'); return; }

      setLoading(true);
      try {
        const userRes = await api.get(`/users/${phone}`);
        setUser(userRes.data);
        
        const historyRes = await api.get(`/nutrition/${userRes.data.id}/history?days=${days}`);
        setHistory(historyRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, days]);

  if (loading && !user) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading trends...</p>
      </div>
    );
  }

  // Format date for X-axis (e.g. "Aug 15")
  const formattedHistory = history.map(h => {
    const d = new Date(h.date);
    return {
      ...h,
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  return (
    <div className="container" style={{ padding: '2rem 2rem 4rem' }}>
      
      {/* ── Header ── */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TrendingUp size={36} color="var(--color-primary)" /> Trends & History
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>See your progress over time.</p>
        </div>
        
        {/* Toggle Days */}
        <div style={{ display: 'flex', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', padding: '0.25rem' }}>
          <button 
            onClick={() => setDays(7)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.9rem',
              background: days === 7 ? 'white' : 'transparent',
              color: days === 7 ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
              boxShadow: days === 7 ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} /> 7 Days
            </div>
          </button>
          <button 
            onClick={() => setDays(30)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.9rem',
              background: days === 30 ? 'white' : 'transparent',
              color: days === 30 ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
              boxShadow: days === 30 ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={16} /> 30 Days
            </div>
          </button>
        </div>
      </div>

      {loading && (
         <div className="flex-center" style={{ margin: '2rem 0' }}>
           <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
         </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* ── Calorie Chart ── */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Calories vs Target</h3>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedHistory} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(16,185,129,0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {user?.dailyCalorieTarget && (
                    <ReferenceLine y={user.dailyCalorieTarget} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'top', value: 'Daily Goal', fill: '#ef4444', fontSize: 12 }} />
                  )}
                  <Bar dataKey="calories" name="Calories Consumed" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Macros Chart ── */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Macronutrient Breakdown</h3>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="protein" name="Protein (g)" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                  <Area type="monotone" dataKey="carbs" name="Carbs (g)" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} />
                  <Area type="monotone" dataKey="fat" name="Fat (g)" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
