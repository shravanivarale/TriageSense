import { Ticket } from '../types';
import { urgencyColor, urgencyBg, emotionEmoji, emotionColor, scoreGradient, tierBadgeStyle, timeAgo } from '../lib/utils';
import { useTicketStore } from '../store/ticketStore';
import * as I from './Icons';

interface Props {
  ticket: Ticket;
  index: number;
}

export function TicketCard({ ticket, index }: Props) {
  const selectTicket = useTicketStore(s => s.selectTicket);
  const tier = tierBadgeStyle(ticket.customer_tier);

  const isProcessing = ticket.status === 'processing';

  return (
    <div
      className="ticket-enter"
      style={{
        animationDelay: `${index * 40}ms`,
        background: ticket.urgency_label === 'CRITICAL' ? 'rgba(255,45,85,0.04)' : '#0F1117',
        border: `1px solid ${ticket.urgency_label === 'CRITICAL' ? 'rgba(255,45,85,0.3)' : '#1E2030'}`,
        borderLeft: `3px solid ${urgencyColor(ticket.urgency_label)}`,
        borderRadius: 8,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: 6,
      }}
      onClick={() => !isProcessing && selectTicket(ticket)}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = '#161820';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#2A2D42';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background =
          ticket.urgency_label === 'CRITICAL' ? 'rgba(255,45,85,0.04)' : '#0F1117';
        (e.currentTarget as HTMLDivElement).style.borderColor =
          ticket.urgency_label === 'CRITICAL' ? 'rgba(255,45,85,0.3)' : '#1E2030';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
      }}
    >
      {isProcessing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: '#00FFB3',
                animation: `livePulse 1s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 13, color: '#00FFB3', fontFamily: "'Space Mono', monospace", letterSpacing: '0.05em' }}>
            AI ANALYZING...
          </span>
          <span style={{ fontSize: 12, color: '#48484A', marginLeft: 'auto' }}>
            {ticket.customer_name ?? 'Unknown'}
          </span>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
            {/* Priority Score */}
            <div style={{
              minWidth: 44, height: 44, borderRadius: 6,
              background: `${scoreGradient(ticket.composite_score)}18`,
              border: `1px solid ${scoreGradient(ticket.composite_score)}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <span style={{
                fontSize: 16, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                color: scoreGradient(ticket.composite_score), lineHeight: 1,
              }}>
                {ticket.composite_score ?? '—'}
              </span>
              <span style={{ fontSize: 8, color: '#48484A', letterSpacing: '0.05em' }}>SCORE</span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Subject + Tier + Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                {ticket.urgency_label && (
                  <span
                    className={ticket.urgency_label === 'CRITICAL' ? 'badge-critical' : ''}
                    style={{
                      fontSize: 9, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                      padding: '2px 7px', borderRadius: 4,
                      background: urgencyBg(ticket.urgency_label),
                      color: urgencyColor(ticket.urgency_label),
                      letterSpacing: '0.08em',
                      border: `1px solid ${urgencyColor(ticket.urgency_label)}30`,
                    }}
                  >{ticket.urgency_label}</span>
                )}
                <span style={{
                  fontSize: 9, padding: '2px 7px', borderRadius: 4,
                  background: tier.bg, color: tier.color,
                  fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em',
                }}>
                  {tier.label}
                </span>
                {ticket.is_escalated === 1 && (
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    background: 'rgba(255,45,85,0.1)', color: '#FF2D55',
                    fontFamily: "'Space Mono', monospace", border: '1px solid rgba(255,45,85,0.3)',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <span style={{ width: 12, height: 12 }} className="badge-critical"><I.AlertTriangleIcon /></span> ESCALATED
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#48484A', marginLeft: 'auto' }}>{timeAgo(ticket.created_at)}</span>
              </div>
              <p style={{
                fontSize: 13, color: '#F5F5F7', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500,
              }}>
                {ticket.subject ?? ticket.raw_text.slice(0, 80)}
              </p>
            </div>
          </div>

          {/* Bottom row: emotion + cluster + action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 54 }}>
            {ticket.primary_emotion && (
              <span style={{
                fontSize: 12, color: emotionColor(ticket.primary_emotion),
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 14 }}>{emotionEmoji(ticket.primary_emotion)}</span>
                {ticket.primary_emotion}
              </span>
            )}
            {ticket.cluster_label && (
              <span style={{
                fontSize: 11, color: '#48484A', background: '#161820',
                padding: '2px 8px', borderRadius: 4, border: '1px solid #1E2030',
              }}>
                {ticket.cluster_label}
              </span>
            )}
            {ticket.processing_time_ms && (
              <span style={{
                fontSize: 10, color: '#00FFB3', fontFamily: "'Space Mono', monospace",
                opacity: 0.6,
              }}>
                {(ticket.processing_time_ms / 1000).toFixed(1)}s
              </span>
            )}
            {ticket.suggested_next_action && (
              <span style={{ fontSize: 11, color: '#64D2FF', marginLeft: 'auto' }}>
                → {ticket.suggested_next_action.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
