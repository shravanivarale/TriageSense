import { useState } from 'react';
import { api } from '../lib/api';
import * as I from './Icons';

const DEMO_TICKETS = [
  { label: 'CRITICAL — Production Down', text: "URGENT: Our entire checkout pipeline has been down for 3 hours. We are an enterprise customer losing approximately $50,000 per hour. Our CTO has been notified. If this is not resolved within 30 minutes we are initiating a chargeback and moving to a competitor. This is completely unacceptable.", tier: 'enterprise', subject: 'PRODUCTION DOWN - Revenue Loss - Immediate Action Required' },
  { label: 'HIGH — Double Billing', text: "I have been charged twice for my Pro subscription this month — $99 charged on the 1st AND the 15th. I checked my bank statement and both charges are confirmed. I've emailed billing 3 times over the past week with no response. I am extremely frustrated and need this refunded immediately.", tier: 'pro', subject: 'Double charge - no response from billing' },
  { label: 'HIGH — Security Breach', text: "SECURITY ALERT: I just noticed someone logged into my account from an IP in Russia. I have never been to Russia. I immediately changed my password but I'm extremely worried. What data was accessed? Do I need to worry about my payment information?", tier: 'enterprise', subject: 'Unauthorized account access - security breach' },
  { label: 'MEDIUM — Login Issue', text: "Can't log into my account. Getting 'invalid credentials' even though I reset my password twice. This has been happening for 2 days and I have a client presentation that depends on accessing my data.", tier: 'pro', subject: 'Login not working - urgent presentation today' },
  { label: 'LOW — Feature Request', text: "Hi there! Love your product so far. Just wondering if there's any chance you could add a dark mode option? It would really help with late-night work sessions. No rush at all, just a suggestion!", tier: 'free', subject: 'Dark mode feature request' },
];

export function SubmitTicket() {
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [tier, setTier] = useState('free');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/tickets', {
        raw_text: text,
        subject: subject || undefined,
        customer_name: name || undefined,
        customer_tier: tier,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
      setText('');
      setName('');
      setSubject('');
    } catch (err) {
      console.error('Submit failed:', err);
    }
    setSubmitting(false);
  };

  const loadDemo = (demo: typeof DEMO_TICKETS[0]) => {
    setText(demo.text);
    setTier(demo.tier);
    setSubject(demo.subject);
  };

  return (
    <div className="glass-panel" style={{ padding: 28, borderRadius: 12, border: '1px solid rgba(42, 45, 66, 0.4)' }}>
      <h2 style={{
        margin: '0 0 20px', fontSize: 13, color: '#9BA1B0',
        letterSpacing: '0.12em', fontFamily: "'Space Mono', monospace",
        display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FFB3', boxShadow: '0 0 8px rgba(0,255,179,0.5)' }} className="live-dot" />
        SUBMIT TICKET — LIVE DEMO
      </h2>

      {/* Demo presets */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {DEMO_TICKETS.map(d => (
          <button
            key={d.label}
            onClick={() => loadDemo(d)}
            style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(42, 45, 66, 0.6)',
              color: '#9BA1B0', cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(0, 255, 179, 0.4)';
              (e.target as HTMLButtonElement).style.color = '#00FFB3';
              (e.target as HTMLButtonElement).style.background = 'rgba(0,255,179,0.06)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(42, 45, 66, 0.6)';
              (e.target as HTMLButtonElement).style.color = '#9BA1B0';
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.03)';
            }}
          >{d.label}</button>
        ))}
      </div>

      {/* Subject */}
      <input
        value={subject}
        onChange={e => setSubject(e.target.value)}
        placeholder="Subject line (optional)"
        style={{
          width: '100%', background: 'rgba(10, 13, 20, 0.6)', border: '1px solid rgba(42, 45, 66, 0.6)',
          borderRadius: 8, padding: '12px 14px', color: '#FFFFFF', fontSize: 14,
          fontFamily: "'DM Sans', sans-serif", marginBottom: 12,
          transition: 'border-color 0.2s', outline: 'none'
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(0, 255, 179, 0.4)'}
        onBlur={e => e.target.style.borderColor = 'rgba(42, 45, 66, 0.6)'}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Customer name (optional)"
          style={{
            flex: 1, background: 'rgba(10, 13, 20, 0.6)', border: '1px solid rgba(42, 45, 66, 0.6)',
            borderRadius: 8, padding: '12px 14px', color: '#FFFFFF', fontSize: 14,
            fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(0, 255, 179, 0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(42, 45, 66, 0.6)'}
        />
        <select
          value={tier}
          onChange={e => setTier(e.target.value)}
          style={{
            background: 'rgba(10, 13, 20, 0.6)', border: '1px solid rgba(42, 45, 66, 0.6)',
            borderRadius: 8, padding: '12px 14px', color: '#FFFFFF', fontSize: 14,
            fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.2s',
            cursor: 'pointer'
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(0, 255, 179, 0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(42, 45, 66, 0.6)'}
        >
          <option value="free">Free tier</option>
          <option value="pro">Pro tier</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste or type the support ticket text here..."
        rows={5}
        style={{
          width: '100%', background: 'rgba(10, 13, 20, 0.6)', border: '1px solid rgba(42, 45, 66, 0.6)', borderRadius: 8,
          padding: '14px 14px', color: '#FFFFFF', fontSize: 14, lineHeight: 1.6,
          fontFamily: "'DM Sans', sans-serif", resize: 'vertical', marginBottom: 20,
          outline: 'none', transition: 'border-color 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(0, 255, 179, 0.4)'}
        onBlur={e => e.target.style.borderColor = 'rgba(42, 45, 66, 0.6)'}
      />

      <button
        onClick={submit}
        disabled={submitting || !text.trim()}
        style={{
          width: '100%', padding: '16px', borderRadius: 8,
          background: submitted ? 'rgba(52,199,89,0.1)' : submitting ? 'rgba(42, 45, 66, 0.4)' : 'transparent',
          color: submitted ? '#34C759' : submitting ? '#9BA1B0' : '#00FFB3',
          border: `1px solid ${submitted ? 'rgba(52,199,89,0.3)' : submitting ? 'rgba(42, 45, 66, 0.4)' : 'rgba(0, 255, 179, 0.4)'}`,
          boxShadow: (!submitting && !submitted) ? '0 0 20px rgba(0,255,179,0.1)' : 'none',
          fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
        }}
        onMouseEnter={e => {
          if (!submitting && !submitted) {
            (e.target as HTMLButtonElement).style.background = 'rgba(0, 255, 179, 0.1)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(0,255,179,0.2)';
            (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={e => {
          if (!submitting && !submitted) {
            (e.target as HTMLButtonElement).style.background = 'transparent';
            (e.target as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(0,255,179,0.1)';
            (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
          }
        }}
      >
        {submitted ? (
          <><span style={{ width: 18, height: 18 }}><I.CheckIcon /></span> Submitted — Watch the queue</>
        ) : submitting ? (
          <><div className="live-dot" style={{ width: 8, height: 8, background: '#00FFB3', borderRadius: '50%' }} /> Sending to AI agents...</>
        ) : (
          <><span style={{ width: 18, height: 18 }}><I.ActivityIcon /></span> Analyze with AI Agents</>
        )}
      </button>
    </div>
  );
}
