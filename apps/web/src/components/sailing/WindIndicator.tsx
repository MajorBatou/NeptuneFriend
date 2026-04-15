import { degreesToCompass, formatWindSpeed, getBeaufortDescription } from '@/utils/sailing';
import type { WindData } from '@/types';
import styles from './WindIndicator.module.css';

interface WindIndicatorProps {
  wind: WindData;
  size?: 'sm' | 'md' | 'lg';
}

export default function WindIndicator({ wind, size = 'md' }: WindIndicatorProps) {
  const compass = degreesToCompass(wind.direction);
  const description = getBeaufortDescription(wind.beaufort);
  const arrowSize = size === 'sm' ? 32 : size === 'lg' ? 64 : 48;

  const beaufortColor =
    wind.beaufort <= 3
      ? 'var(--color-wind-calm)'
      : wind.beaufort <= 5
        ? 'var(--color-wind-moderate)'
        : 'var(--color-wind-strong)';

  return (
    <div className={[styles.wrapper, styles[size]].join(' ')}>
      <div className={styles.compass}>
        <svg
          width={arrowSize}
          height={arrowSize}
          viewBox="0 0 48 48"
          aria-label={`Wind direction: ${compass}, ${wind.speed} knots`}
          role="img"
        >
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="var(--color-sea-foam)"
            stroke="var(--color-ocean-light)"
            strokeWidth="1.5"
          />
          {/* Direction arrow */}
          <g transform={`rotate(${wind.direction}, 24, 24)`}>
            <polygon points="24,6 28,30 24,26 20,30" fill={beaufortColor} />
          </g>
          {/* Center dot */}
          <circle cx="24" cy="24" r="3" fill="var(--color-ocean-deep)" />
        </svg>
      </div>

      <div className={styles.data}>
        <div className={styles.speed} style={{ color: beaufortColor }}>
          {formatWindSpeed(wind.speed)}
        </div>
        <div className={styles.direction}>{compass}</div>
        <div className={styles.beaufort}>
          Bf {wind.beaufort} · {description}
        </div>
        {wind.gust > wind.speed + 5 && (
          <div className={styles.gust}>Gusts {formatWindSpeed(wind.gust)}</div>
        )}
      </div>
    </div>
  );
}
