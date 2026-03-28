export interface Ticket {
  id: string;
  raw_text: string;
  subject?: string;
  customer_name?: string;
  customer_email?: string;
  customer_tier: 'free' | 'pro' | 'enterprise';
  urgency_score?: number;
  urgency_label?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  urgency_signals?: string[];
  urgency_confidence?: number;
  sentiment_score?: number;
  primary_emotion?: string;
  escalation_risk?: number;
  sentiment_signals?: string[];
  sentiment_confidence?: number;
  category?: string;
  subcategory?: string;
  cluster_label?: string;
  draft_subject?: string;
  draft_body?: string;
  response_tone?: string;
  suggested_next_action?: string;
  composite_score?: number;
  is_escalated: number;
  status: 'pending' | 'processing' | 'resolved' | 'escalated';
  processing_time_ms?: number;
  created_at: string;
  churn_indicators?: string[];
}

export interface Stats {
  total_tickets: number;
  critical_unresolved: number;
  escalated: number;
  avg_composite_score: number;
  avg_sentiment: number;
  avg_processing_ms: number;
  clusters: { label: string; count: number }[];
  categories: { label: string; count: number }[];
  urgency_distribution: { label: string; count: number }[];
}

export interface SentimentPoint {
  time: string;
  sentiment: number;
  cluster: string;
  urgency: string;
}

export type WSMessage =
  | { type: 'ticket_processing'; payload: { id: string; status: string; created_at: string } }
  | { type: 'ticket_processed'; payload: Ticket }
  | { type: 'ticket_updated'; payload: Partial<Ticket> & { id: string } }
  | { type: 'cluster_storm'; payload: { cluster_label: string; count: number; category: string } }
  | { type: 'ping' };
