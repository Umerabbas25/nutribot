import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color = 'var(--color-primary)' }) => {
  return (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: `4px solid ${color}` }}>
      <div className="flex-between">
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          {title}
        </span>
        {icon && <div style={{ color }}>{icon}</div>}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
