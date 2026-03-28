import { useEffect } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { StatsBar } from './StatsBar';
import { TicketCard } from './TicketCard';
import { TicketModal } from './TicketModal';
import { ClusterStormBanner } from './ClusterStormBanner';
import { SubmitTicket } from './SubmitTicket';
import { AnalyticsPage } from './AnalyticsPage';
import { LoadingSkeleton } from './LoadingSkeleton';
import * as I from './Icons';

export function Dashboard() {
  const { tickets, setTickets, activeTab, setActiveTab } = useTicketStore();
  useWebSocket();

  const { data, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.get('/tickets?limit=50').then(r => r.data),
  });

  useEffect(() => { if (data) setTickets(data); }, [data]);

  const sorted = [...tickets].sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0));

  const navItems = [
    { key: 'dashboard' as const, label: 'Dashboard', icon: <I.NavDashboardIcon /> },
    { key: 'analytics' as const, label: 'Analytics', icon: <I.NavAnalyticsIcon /> },
    { key: 'submit' as const, label: 'Submit', icon: <I.NavSubmitIcon /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top nav */}
      <div style={{
        background: 'rgba(10, 13, 20, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(42, 45, 66, 0.3)', padding: '0 24px',
        height: 64, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, position: 'relative', zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="live-dot signal-glow" style={{
            width: 10, height: 10, borderRadius: '50%', background: '#00FFB3',
          }} />
          <span style={{
            fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace",
            color: '#FFFFFF', letterSpacing: '0.1em',
          }}>TRIAGESENSE</span>
        </div>
        <span style={{ fontSize: 12, color: '#5C6275', marginLeft: 8, letterSpacing: '0.05em' }}>AI Support Intelligence</span>

        {/* Navigation */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {navItems.map(item => (
            <button
              key={item.key}
              className={activeTab === item.key ? 'nav-active' : ''}
              onClick={() => setActiveTab(item.key)}
              style={{
                background: activeTab === item.key ? 'rgba(0,255,179,0.06)' : 'none',
                border: `1px solid ${activeTab === item.key ? 'rgba(0, 255, 179, 0.3)' : 'transparent'}`,
                color: activeTab === item.key ? '#00FFB3' : '#9BA1B0',
                padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => {
                if (activeTab !== item.key) {
                  (e.currentTarget).style.background = 'rgba(255, 255, 255, 0.03)';
                  (e.currentTarget).style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== item.key) {
                  (e.currentTarget).style.background = 'none';
                  (e.currentTarget).style.color = '#9BA1B0';
                }
              }}
            >
              <span style={{ width: 16, height: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <StatsBar />

      {/* Main content area */}
      {activeTab === 'analytics' ? (
        <div style={{ flex: 1, overflow: 'auto', background: 'transparent' }}>
          <AnalyticsPage />
        </div>
      ) : activeTab === 'submit' ? (
        <div style={{ flex: 1, overflow: 'auto', background: 'transparent' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px' }}>
            <SubmitTicket />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main queue */}
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            <ClusterStormBanner />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
            }}>
              <span style={{
                fontSize: 11, color: '#5C6275', letterSpacing: '0.12em',
                fontFamily: "'Space Mono', monospace", fontWeight: 700
              }}>
                PRIORITY QUEUE — {sorted.length} TICKETS
              </span>
              <span style={{ fontSize: 11, color: '#5C6275', fontFamily: "'Space Mono', monospace" }}>sorted by composite score ↓</span>
            </div>
            {isLoading ? (
              <LoadingSkeleton />
            ) : sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', color: '#5C6275' }}>
                <div style={{ width: 48, height: 48, margin: '0 auto 20px', color: 'rgba(255,255,255,0.1)' }}>
                  <I.InboxIcon />
                </div>
                <p style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 14,
                  color: '#9BA1B0', marginBottom: 6, fontWeight: 700
                }}>Queue empty</p>
                <p style={{ fontSize: 13, color: '#5C6275' }}>
                  Submit a ticket to see AI analysis in real-time
                </p>
              </div>
            ) : (
              sorted.map((ticket, i) => (
                <TicketCard key={ticket.id} ticket={ticket} index={i} />
              ))
            )}
          </div>

          {/* Right sidebar */}
          <div style={{
            width: 420, borderLeft: '1px solid rgba(42, 45, 66, 0.4)', overflow: 'auto',
            flexShrink: 0, background: 'rgba(10, 13, 20, 0.3)', backdropFilter: 'blur(10px)',
          }}>
            <SubmitTicket />
          </div>
        </div>
      )}

      <TicketModal />
    </div>
  );
}
