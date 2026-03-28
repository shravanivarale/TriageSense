interface ConfidencePanelProps {
  urgencyConfidence?: number;
  sentimentConfidence?: number;
  processingTimeMs?: number;
}

export function ConfidencePanel({ urgencyConfidence, sentimentConfidence, processingTimeMs }: ConfidencePanelProps) {
  const agents = [
    { name: 'URGENCY AGENT', confidence: urgencyConfidence, color: '#FF9500' },
    { name: 'SENTIMENT AGENT', confidence: sentimentConfidence, color: '#64D2FF' },
    { name: 'CLUSTER AGENT', confidence: 0.85, color: '#30D158' },
    { name: 'RESPONSE AGENT', confidence: 0.90, color: '#BF5AF2' },
  ];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        fontSize: 10, color: '#48484A', letterSpacing: '0.1em',
        fontFamily: "'Space Mono', monospace", marginBottom: 10,
      }}>
        AI AGENT CONFIDENCE
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agents.map(agent => {
          const conf = agent.confidence ?? 0;
          return (
            <div key={agent.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#8E8E93', fontFamily: "'Space Mono', monospace" }}>
                  {agent.name}
                </span>
                <span style={{
                  fontSize: 11, color: agent.color,
                  fontFamily: "'Space Mono', monospace", fontWeight: 700,
                }}>
                  {Math.round(conf * 100)}%
                </span>
              </div>
              <div style={{
                height: 4, background: '#1E2030', borderRadius: 2, overflow: 'hidden',
              }}>
                <div
                  className="bar-fill"
                  style={{
                    height: '100%',
                    width: `${conf * 100}%`,
                    background: `linear-gradient(90deg, ${agent.color}80, ${agent.color})`,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {processingTimeMs && (
        <div style={{
          marginTop: 12, padding: '8px 12px', background: 'rgba(0,255,179,0.04)',
          borderRadius: 6, border: '1px solid rgba(0,255,179,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 10, color: '#48484A', fontFamily: "'Space Mono', monospace" }}>
            TOTAL PROCESSING TIME
          </span>
          <span style={{
            fontSize: 16, color: '#00FFB3', fontFamily: "'Space Mono', monospace", fontWeight: 700,
          }}>
            {(processingTimeMs / 1000).toFixed(1)}s
          </span>
        </div>
      )}
    </div>
  );
}
