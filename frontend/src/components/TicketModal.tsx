import { useEffect } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { timeAgo, urgencyColor, scoreGradient, tierBadgeStyle, emotionColor } from '../lib/utils';
import { ConfidencePanel } from './ConfidencePanel';
import * as I from './Icons';

export function TicketModal() {
  const selectedTicket = useTicketStore(s => s.selectedTicket);
  const selectTicket = useTicketStore(s => s.selectTicket);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') selectTicket(null); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!selectedTicket) return null;

  const t = selectedTicket;
  const tier = tierBadgeStyle(t.customer_tier);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end',
      background: 'rgba(3, 5, 9, 0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      opacity: selectedTicket ? 1 : 0, transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)', pointerEvents: selectedTicket ? 'auto' : 'none',
    }} onClick={() => selectTicket(null)}>

      <div
        className="drawer-enter glass-panel"
        style={{
          width: '100%', maxWidth: 640, height: '100%',
          borderLeft: `1px solid rgba(42, 45, 66, 0.7)`,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Radar styling */}
        <div style={{
          padding: '32px 32px 24px', position: 'relative',
          background: 'linear-gradient(180deg, rgba(16, 20, 28, 0.9) 0%, rgba(10, 13, 20, 0.8) 100%)',
          borderBottom: '1px solid rgba(42, 45, 66, 0.4)',
        }}>
          {t.urgency_label === 'CRITICAL' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: '#FF2D55', boxShadow: '0 0 20px #FF2D5580',
            }} />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            {/* Priority Score Circle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `${scoreGradient(t.composite_score)}15`,
                border: `2px solid ${scoreGradient(t.composite_score)}50`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 30px ${scoreGradient(t.composite_score)}20, inset 0 0 20px ${scoreGradient(t.composite_score)}10`,
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', inset: -6, border: `1px dashed ${scoreGradient(t.composite_score)}30`, borderRadius: '50%', animation: 'spin 10s linear infinite' }} />
                <span style={{
                  fontSize: 24, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                  color: scoreGradient(t.composite_score), lineHeight: 1, textShadow: `0 0 10px ${scoreGradient(t.composite_score)}80`,
                }}>
                  {t.composite_score ?? '—'}
                </span>
                <span style={{ fontSize: 9, color: '#9BA1B0', letterSpacing: '0.1em', marginTop: 2 }}>SCORE</span>
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  {t.urgency_label && (
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 4,
                      background: `rgba(${t.urgency_label === 'CRITICAL' ? '255,45,85' : t.urgency_label === 'HIGH' ? '255,149,0' : t.urgency_label === 'MEDIUM' ? '255,214,10' : '52,199,89'}, 0.15)`,
                      color: urgencyColor(t.urgency_label), border: `1px solid ${urgencyColor(t.urgency_label)}40`,
                      fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: '0.05em'
                    }}>{t.urgency_label}</span>
                  )}
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 4, background: tier.bg, color: tier.color, border: `1px solid ${tier.color}30`,
                     fontFamily: "'Space Mono', monospace"
                  }}>{tier.label}</span>
                </div>
                {t.is_escalated === 1 && (
                  <div style={{
                    color: '#FF2D55', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif"
                  }}>
                    <span style={{ width: 14, height: 14 }} className="badge-critical"><I.AlertTriangleIcon /></span>
                    ESCALATION REQUIRED
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => selectTicket(null)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9BA1B0',
                width: 32, height: 32, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', padding: 0
              }}
              onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget).style.color = '#FFFFFF'; }}
              onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget).style.color = '#9BA1B0'; }}
            >
              <span style={{ width: 16, height: 16 }}><I.XIcon /></span>
            </button>
          </div>

          <h2 style={{ fontSize: 20, color: '#FFFFFF', margin: '0 0 12px', lineHeight: 1.4, fontWeight: 600 }}>
            {t.subject ?? 'No Subject Provided'}
          </h2>

          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#9BA1B0', fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, color: '#5C6275' }}><I.AccountIcon /></span> {t.customer_name ?? 'Unknown Customer'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, color: '#5C6275' }}><I.TimerIcon /></span> {timeAgo(t.created_at)}
            </span>
          </div>
        </div>

        {/* Content Tabs area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24, background: 'rgba(10, 13, 20, 0.4)' }}>
          {/* AI Analysis Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Category */}
            <div style={{
              background: 'rgba(16, 20, 28, 0.6)', padding: 16, borderRadius: 8,
              border: '1px solid rgba(42, 45, 66, 0.5)', display: 'flex', alignItems: 'flex-start', gap: 12
            }}>
              <div style={{ width: 36, height: 36, background: 'rgba(100,210,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64D2FF' }}>
                <span style={{ width: 20, height: 20 }}><I.InfoIcon /></span>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#5C6275', margin: '0 0 4px', fontFamily: "'Space Mono', monospace", letterSpacing: '0.05em' }}>PREDICTED CATEGORY</p>
                <p style={{ fontSize: 14, color: '#E2E8F0', margin: 0, fontWeight: 600 }}>{t.cluster_label ?? 'Uncategorized'}</p>
              </div>
            </div>

            {/* Emotion */}
            <div style={{
              background: 'rgba(16, 20, 28, 0.6)', padding: 16, borderRadius: 8,
              border: '1px solid rgba(42, 45, 66, 0.5)', display: 'flex', alignItems: 'flex-start', gap: 12
            }}>
              <div style={{ width: 36, height: 36, background: `${emotionColor(t.primary_emotion)}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: emotionColor(t.primary_emotion) }}>
                <span style={{ width: 20, height: 20 }}><I.ActivityIcon /></span>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#5C6275', margin: '0 0 4px', fontFamily: "'Space Mono', monospace", letterSpacing: '0.05em' }}>USER SENTIMENT</p>
                <p style={{ fontSize: 14, color: '#E2E8F0', margin: 0, fontWeight: 600, textTransform: 'capitalize' }}>{t.primary_emotion ?? 'Neutral'}</p>
              </div>
            </div>
          </div>

          {/* Action Item */}
          {t.suggested_next_action && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,255,179,0.05) 0%, rgba(0,255,179,0.01) 100%)',
              border: '1px solid rgba(0,255,179,0.2)', borderRadius: 8, padding: 20,
              boxShadow: '0 4px 20px rgba(0,255,179,0.05)'
            }}>
              <h3 style={{
                fontSize: 11, color: '#00FFB3', margin: '0 0 10px', fontFamily: "'Space Mono', monospace",
                display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.1em'
              }}>
                <span style={{ width: 14, height: 14 }}><I.TrendingUpIcon /></span> RECOMMENDED ACTION
              </h3>
              <p style={{ fontSize: 15, color: '#F5F5F7', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                {t.suggested_next_action.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          {/* Raw Text */}
          <div>
            <h3 style={{ fontSize: 12, color: '#5C6275', marginBottom: 12, fontFamily: "'Space Mono', monospace", letterSpacing: '0.05em' }}>ORIGINAL MESSAGE</h3>
            <div style={{
              background: 'rgba(3, 5, 9, 0.5)', border: '1px solid rgba(42, 45, 66, 0.3)',
              borderRadius: 8, padding: 20, color: '#E2E8F0', fontSize: 14, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif"
            }}>
              {t.raw_text}
            </div>
          </div>

          {/* Confidence & Timing Data */}
          <ConfidencePanel ticket={t} />

        </div>
      </div>
    </div>
  );
}
