import type { SafetyRating } from '@/types';
import styles from './SafetyBadge.module.css';

interface SafetyBadgeProps {
  rating: SafetyRating;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const RATING_CONFIG: Record<SafetyRating, { label: string; icon: string }> = {
  safe: { label: 'Safe to sail', icon: '✓' },
  caution: { label: 'Sail with caution', icon: '⚠' },
  danger: { label: 'Dangerous conditions', icon: '✕' },
};

export default function SafetyBadge({ rating, size = 'md', showLabel = true }: SafetyBadgeProps) {
  const config = RATING_CONFIG[rating];

  return (
    <div
      className={[styles.badge, styles[rating], styles[size]].join(' ')}
      role="status"
      aria-label={config.label}
    >
      <span className={styles.icon} aria-hidden="true">
        {config.icon}
      </span>
      {showLabel && <span className={styles.label}>{config.label}</span>}
    </div>
  );
}
