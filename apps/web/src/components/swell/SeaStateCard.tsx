import type { WaveData, SeaState } from '@/types';
import { SEA_STATE_DESCRIPTIONS } from '@/types';
import styles from './SeaStateCard.module.css';

interface SeaStateCardProps {
  waves: WaveData;
  modelCount?: number;
}

const SEA_STATE_COLORS: Record<SeaState, { bg: string; text: string; border: string }> = {
  glassy: { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  calm: { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  smooth: { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  slight: { bg: '#fefce8', text: '#a16207', border: '#fde047' },
  moderate: { bg: '#fefce8', text: '#a16207', border: '#fde047' },
  rough: { bg: '#fff7ed', text: '#c2410c', border: '#fb923c' },
  'very-rough': { bg: '#fff7ed', text: '#c2410c', border: '#fb923c' },
  high: { bg: '#fef2f2', text: '#dc2626', border: '#f87171' },
  'very-high': { bg: '#fef2f2', text: '#dc2626', border: '#f87171' },
  phenomenal: { bg: '#fef2f2', text: '#991b1b', border: '#ef4444' },
  confused: { bg: '#fef2f2', text: '#dc2626', border: '#ef4444' },
};

function calcSignificantWaveHeight(waves: WaveData): number {
  if (!waves.secondarySwell) return waves.primarySwell.height;
  // Significant wave height combines both swells: √(H1² + H2²)
  return (
    Math.round(Math.sqrt(waves.primarySwell.height ** 2 + waves.secondarySwell.height ** 2) * 10) /
    10
  );
}

export default function SeaStateCard({ waves, modelCount }: SeaStateCardProps) {
  const config = SEA_STATE_COLORS[waves.seaState];
  const significantHeight = calcSignificantWaveHeight(waves);
  const description = SEA_STATE_DESCRIPTIONS[waves.seaState];

  return (
    <div
      className={styles.card}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
      }}
    >
      <div className={styles.header}>
        <div>
          <div className={styles.seaState} style={{ color: config.text }}>
            {waves.seaState.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </div>
          <div className={styles.description}>{description}</div>
        </div>
        {waves.confusedSea && <div className={styles.confusedBadge}>Confused</div>}
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Sig. wave height</span>
          <span className={styles.statValue} style={{ color: config.text }}>
            {significantHeight}m
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Primary swell</span>
          <span className={styles.statValue}>
            {waves.primarySwell.height}m / {waves.primarySwell.period}s
          </span>
        </div>
        {waves.secondarySwell && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>Secondary swell</span>
            <span className={styles.statValue}>
              {waves.secondarySwell.height}m / {waves.secondarySwell.period}s
            </span>
          </div>
        )}
        {waves.swellAngle !== undefined && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>Swell angle</span>
            <span
              className={styles.statValue}
              style={{
                color: waves.confusedSea ? '#dc2626' : 'inherit',
              }}
            >
              {waves.swellAngle.toFixed(0)}°{waves.confusedSea ? ' ⚠' : ''}
            </span>
          </div>
        )}
        <div className={styles.stat}>
          <span className={styles.statLabel}>Steepness</span>
          <span
            className={styles.statValue}
            style={{
              color: waves.primarySwell.steepness > 0.04 ? '#dc2626' : 'inherit',
            }}
          >
            {waves.primarySwell.steepness.toFixed(3)}
            {waves.primarySwell.steepness > 0.04 ? ' — breaking risk' : ''}
          </span>
        </div>
      </div>

      {modelCount && modelCount > 1 && (
        <div className={styles.models}>Blended from {modelCount} weather models</div>
      )}
    </div>
  );
}
