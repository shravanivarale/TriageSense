import { useTicketStore } from '../store/ticketStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { urgencyColor } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { SentimentPoint } from '../types';

const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: '#FF2D55',
  HIGH: '#FF9500',
  MEDIUM: '#FFD60A',
  LOW: '#34C759',
};

const CATEGORY_COLORS = ['#00FFB3', '#64D2FF', '#FF9500', '#FF2D55', '#BF5AF2', '#FFD60A', '#30D158', '#FF453A'];

export function AnalyticsPage() {
  const { stats, tickets } = useTicketStore();

  const { data: sentimentData } = useQuery({
    queryKey: ['sentiment-timeline'],
    queryFn: () => api.get('/sentiment-timeline').then(r => r.data),
    refetchInterval: 15000,
  });

  // Urgency distribution data
  const urgencyData = stats?.urgency_distribution?.map(item => ({
    name: item.label,
    value: item.count,
    fill: URGENCY_COLORS[item.label] || '#8E8E93',
  })) ?? [];

  // Category distribution
  const categoryData = stats?.categories?.map((item, i) => ({
    name: item.label,
    count: item.count,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  })) ?? [];

  // Cluster distribution
  const clusterData = stats?.clusters?.map((item, i) => ({
    name: item.label?.length > 20 ? item.label.slice(0, 20) + '…' : item.label,
    count: item.count,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  })) ?? [];

  // Sentiment timeline
  const sentimentTimeline = (sentimentData as SentimentPoint[] || []).map(p => ({
    time: new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sentiment: p.sentiment,
    urgency: p.urgency,
  }));

  // Emotion distribution from current tickets
  const emotionCounts: Record<string, number> = {};
  tickets.forEach(t => {
    if (t.primary_emotion) {
      emotionCounts[t.primary_emotion] = (emotionCounts[t.primary_emotion] || 0) + 1;
    }
  });
  const emotionData = Object.entries(emotionCounts).map(([name, value], i) => ({
    name,
    value,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const tooltipStyle = {
    contentStyle: { background: 'rgba(16, 20, 28, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(42, 45, 66, 0.6)', borderRadius: 8, fontSize: 13, color: '#FFFFFF', padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
    itemStyle: { color: '#9BA1B0', fontWeight: 500 },
  };

  return (
    <div style={{ padding: 32, overflow: 'auto', height: '100%', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{
        margin: '0 0 32px', fontSize: 13, color: '#9BA1B0',
        letterSpacing: '0.12em', fontFamily: "'Space Mono', monospace", fontWeight: 700
      }}>
        ANALYTICS DASHBOARD
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Urgency Distribution */}
        <ChartCard title="URGENCY DISTRIBUTION">
          {urgencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={urgencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  stroke="rgba(10, 13, 20, 1)"
                  strokeWidth={3}
                >
                  {urgencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 16 }}>
            {urgencyData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.fill, boxShadow: `0 0 8px ${item.fill}80` }} />
                <span style={{ color: '#9BA1B0', fontWeight: 500 }}>{item.name}</span>
                <span style={{ color: item.fill, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard title="CATEGORY BREAKDOWN">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42, 45, 66, 0.3)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9BA1B0', fontSize: 10 }} axisLine={{ stroke: 'rgba(42, 45, 66, 0.6)' }} tickLine={false} />
                <YAxis tick={{ fill: '#9BA1B0', fontSize: 11 }} axisLine={{ stroke: 'rgba(42, 45, 66, 0.6)' }} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        {/* Sentiment Timeline */}
        <ChartCard title="SENTIMENT TIMELINE">
          {sentimentTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={sentimentTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42, 45, 66, 0.3)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#9BA1B0', fontSize: 10 }} axisLine={{ stroke: 'rgba(42, 45, 66, 0.6)' }} tickLine={false} />
                <YAxis domain={[-100, 100]} tick={{ fill: '#9BA1B0', fontSize: 11 }} axisLine={{ stroke: 'rgba(42, 45, 66, 0.6)' }} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <defs>
                  <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64D2FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#64D2FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="sentiment" stroke="#64D2FF" fill="url(#sentimentGrad)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        {/* Emotion Distribution */}
        <ChartCard title="EMOTION DISTRIBUTION">
          {emotionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={emotionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  stroke="rgba(10, 13, 20, 1)"
                  strokeWidth={3}
                >
                  {emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 16 }}>
            {emotionData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.fill, boxShadow: `0 0 8px ${item.fill}80` }} />
                <span style={{ color: '#9BA1B0', fontWeight: 500, textTransform: 'capitalize' }}>{item.name}</span>
                <span style={{ color: item.fill, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Cluster Leaderboard */}
        <ChartCard title="TOP CLUSTERS" span={2}>
          {clusterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clusterData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42, 45, 66, 0.3)" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#9BA1B0', fontSize: 11 }} axisLine={{ stroke: 'rgba(42, 45, 66, 0.6)' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#FFFFFF', fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: 'rgba(42, 45, 66, 0.6)' }} width={180} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {clusterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children, span }: { title: string; children: React.ReactNode; span?: number }) {
  return (
    <div className="glass-panel" style={{
      borderRadius: 12, padding: 24,
      gridColumn: span ? `span ${span}` : undefined,
    }}>
      <div style={{
        fontSize: 11, color: '#9BA1B0', letterSpacing: '0.12em',
        fontFamily: "'Space Mono', monospace", marginBottom: 20, fontWeight: 700,
        paddingBottom: 12, borderBottom: '1px solid rgba(42, 45, 66, 0.4)',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{
      height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#5C6275', fontSize: 13, fontFamily: "'Space Mono', monospace",
    }}>
      No data yet — submit tickets to see analytics
    </div>
  );
}
