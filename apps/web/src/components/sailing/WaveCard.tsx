import { formatWaveHeight, degreesToCompass } from '@/utils/sailing';
import type { WaveData } from '@/types';
import styles from './WaveCard.module.css';

interface WaveCardProps {
  waves: WaveData;
}

export default function WaveCard({ waves }: WaveCardProps) {
  const heightColor =
    waves.height < 0.5
      ? 'var(--color-wind-calm)'
      : waves.height < 1.5
        ? 'var(--color-wind-moderate)'
        : 'var(--color-wind-strong)';

  const barHeight = Math.min((waves.height / 5) * 100, 100);

  return (
    <div className={styles.card}>
      <div className={styles.visual}>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            style={{ height: `${barHeight}%`, backgroundColor: heightColor }}
            role="meter"
            aria-valuenow={waves.height}
            aria-valuemin={0}
            aria-valuemax={5}
            aria-label={`Wave height: ${formatWaveHeight(waves.height)}`}
          />
        </div>
      </div>

      <div className={styles.data}>
        <div className={styles.height} style={{ color: heightColor }}>
          {formatWaveHeight(waves.height)}
        </div>
        <div className={styles.label}>Wave height</div>

        <div className={styles.detail}>
          <span className={styles.detailLabel}>Period</span>
          <span className={styles.detailValue}>{waves.period}s</span>
        </div>
        <div className={styles.detail}>
          <span className={styles.detailLabel}>Direction</span>
          <span className={styles.detailValue}>{degreesToCompass(waves.direction)}</span>
        </div>
        {waves.primarySwell.height > 0 && (
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Swell</span>
            <span className={styles.detailValue}>
              {formatWaveHeight(waves.primarySwell.height)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
