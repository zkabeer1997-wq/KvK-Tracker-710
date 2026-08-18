'use client';

const TONE_BY_STATUS = {
  pending: 'neutral',
  special: 'gold',
  normal: 'success',
  reject: 'danger',
  waitlist: 'violet',
};

export default function StatusBadge({ status, label }) {
  const tone = TONE_BY_STATUS[status] || 'neutral';
  return <span className={`status-badge status-badge-${tone}`}>{label}</span>;
}
