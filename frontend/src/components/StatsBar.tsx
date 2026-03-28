import { useEffect } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import * as I from './Icons';

export function StatsBar() {
  const { stats, setStats, processingIds, tickets } = useTicketStore();

  const { data } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats').then(r => r.data),
    refetchInterval: 10000,
  });

  useEffect(() => { if (data) setStats(data); }, [data]);

  const criticalCount = tickets.filter(t => t.urgency_label === 'CRITICAL').length;
  const processingCount = processingIds.size;
  const avgProcessing = stats?.avg_processing_ms ? `${(stats.avg_processing_ms / 1000).toFixed(1)}s` : '—';

  const statItems = [
    { label: 'TOTAL TICKETS', value: stats?.total_tickets ?? tickets.length, color: '#FFFFFF', icon: <I.BarChartIcon /> },
    { label: 'CRITICAL', value: criticalCount, color: '#FF2D55', icon: <I.AlertTriangleIcon /> },
    { label: 'ESCALATED', value: stats?.escalated ?? 0, color: '#FF9500', icon: <I.TrendingUpIcon /> },
    { label: 'PROCESSING', value: processingCount, color: '#00FFB3', icon: <I.ActivityIcon /> },
    { label: 'AVG PRIORITY', value: stats ? `${Math.round(stats.avg_composite_score)}/100` : '—', color: '#64D2FF', icon: <I.TargetIcon /> },
    { label: 'AVG SPEED', value: avgProcessing, color: '#00FFB3', icon: <I.TimerIcon /> },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '1px',
      background: 'rgba(42, 45, 66, 0.4)',
      borderBottom: '1px solid rgba(42, 45, 66, 0.6)',
      position: 'relative',
      zIndex: 10,
    }}>
      {statItems.map(stat => (
        <div key={stat.label} className="glass-panel" style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'default',
          border: 'none',
          boxShadow: 'none',
          borderBottom: `2px solid transparent`,
          background: 'rgba(10, 13, 20, 0.8)',
        }}
        onMouseEnter={e => { 
          (e.currentTarget).style.background = 'rgba(16, 20, 28, 0.9)'; 
          (e.currentTarget).style.borderBottom = `2px solid ${stat.color}`;
          (e.currentTarget).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => { 
          (e.currentTarget).style.background = 'rgba(10, 13, 20, 0.8)';
          (e.currentTarget).style.borderBottom = `2px solid transparent`;
          (e.currentTarget).style.transform = 'translateY(0)';
        }}
        >
          <span style={{
            fontSize: 10,
            letterSpacing: '0.12em',
            color: '#5C6275',
            fontFamily: "'Space Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 700,
          }}>
            <span style={{ width: 14, height: 14, opacity: 0.7, color: stat.color }}>{stat.icon}</span>
            {stat.label}
          </span>
          <span className="count-up" style={{
            fontSize: 26,
            fontFamily: "'Space Mono', monospace",
            color: stat.color,
            fontWeight: 700,
            textShadow: `0 0 16px ${stat.color}40`,
          }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
