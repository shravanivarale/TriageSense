import { useTicketStore } from '../store/ticketStore';
import * as I from './Icons';

export function ClusterStormBanner() {
  const { clusterStorm, dismissStorm } = useTicketStore();
  if (!clusterStorm) return null;

  return (
    <div className="storm-active fade-in glass-panel" style={{
      background: 'rgba(255,149,0,0.15)',
      border: '1px solid rgba(255,149,0,0.6)',
      borderRadius: 12,
      padding: '16px 20px',
      margin: '0 0 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 8px 32px rgba(255,149,0,0.15)',
    }}>
      <span style={{ color: '#FF9500', width: 28, height: 28 }} className="signal-glow"><I.StormIcon /></span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#FFFFFF', fontWeight: 700, fontFamily: "'Space Mono', monospace", letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
          CLUSTER STORM DETECTED
          <span className="live-dot" style={{ width: 6, height: 6, background: '#FF9500', borderRadius: '50%' }} />
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#9BA1B0', marginTop: 4 }}>
          <strong style={{ color: '#FF9500' }}>{clusterStorm.count}</strong> tickets matching "<span style={{ color: '#FFFFFF' }}>{clusterStorm.cluster_label}</span>" in the last 30 minutes — coordinated issue predicted.
        </p>
      </div>
      <button
        onClick={dismissStorm}
        style={{
          background: 'none', border: '1px solid rgba(255,149,0,0.3)',
          color: '#FF9500', padding: '6px 14px', borderRadius: 4,
          cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif",
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(255,149,0,0.1)'; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'none'; }}
      >Dismiss</button>
    </div>
  );
}
