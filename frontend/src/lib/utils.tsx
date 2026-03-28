import React from 'react';

export const urgencyColor = (label?: string) => ({
  CRITICAL: '#FF2D55',
  HIGH: '#FF9500',
  MEDIUM: '#FFD60A',
  LOW: '#34C759',
}[label ?? ''] ?? '#8E8E93');

export const urgencyBg = (label?: string) => ({
  CRITICAL: 'rgba(255,45,85,0.12)',
  HIGH: 'rgba(255,149,0,0.12)',
  MEDIUM: 'rgba(255,214,10,0.12)',
  LOW: 'rgba(52,199,89,0.12)',
}[label ?? ''] ?? 'rgba(142,142,147,0.12)');

import * as I from '../components/Icons';

export const emotionEmoji = (emotion?: string) => {
  switch(emotion) {
    case 'angry': return <I.AngryIcon />;
    case 'frustrated': return <I.FrustratedIcon />;
    case 'panicked': return <I.PanickedIcon />;
    case 'confused': return <I.ConfusedIcon />;
    case 'disappointed': return <I.DisappointedIcon />;
    case 'neutral': return <I.NeutralIcon />;
    case 'hopeful': return <I.HopefulIcon />;
    case 'grateful': return <I.GratefulIcon />;
    default: return <I.NeutralIcon />;
  }
};

export const emotionColor = (emotion?: string) => ({
  angry: '#FF453A',
  frustrated: '#FF9F0A',
  panicked: '#FF2D55',
  confused: '#64D2FF',
  disappointed: '#FF9F0A',
  neutral: '#8E8E93',
  hopeful: '#64D2FF',
  grateful: '#30D158',
}[emotion ?? ''] ?? '#8E8E93');

export const scoreGradient = (score?: number): string => {
  if (!score && score !== 0) return '#8E8E93';
  if (score >= 85) return '#FF2D55';
  if (score >= 65) return '#FF9500';
  if (score >= 40) return '#FFD60A';
  return '#34C759';
};

export const tierBadgeStyle = (tier: string) => ({
  enterprise: { bg: 'rgba(0,255,179,0.1)', color: '#00FFB3', label: 'ENTERPRISE' },
  pro: { bg: 'rgba(100,210,255,0.1)', color: '#64D2FF', label: 'PRO' },
  free: { bg: 'rgba(142,142,147,0.1)', color: '#8E8E93', label: 'FREE' },
}[tier] ?? { bg: 'rgba(142,142,147,0.1)', color: '#8E8E93', label: tier.toUpperCase() });

export const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
};

export const categoryIcon = (category?: string) => {
  switch(category) {
    case 'billing': return <I.BillingIcon />;
    case 'authentication': return <I.AuthIcon />;
    case 'performance': return <I.PerformanceIcon />;
    case 'data_loss': return <I.DataLossIcon />;
    case 'integration': return <I.IntegrationIcon />;
    case 'ui_bug': return <I.UIBugIcon />;
    case 'feature_request': return <I.FeatureIcon />;
    case 'security': return <I.SecurityIcon />;
    case 'account': return <I.AccountIcon />;
    default: return <I.GenericIcon />;
  }
};
