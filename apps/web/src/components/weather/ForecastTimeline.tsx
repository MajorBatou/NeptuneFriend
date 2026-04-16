import { useState } from 'react';
import { useForecast } from '@/hooks';
import { formatTime, formatDate, windSpeedToBeaufort, degreesToCompass } from '@/utils/sailing';
import { Spinner, SkeletonCard } from '@/components/ui';
import styles from './ForecastTimeline.module.css';

type ForecastPeriod = 24 | 72 | 168;

const PERIOD_LABELS: Record<ForecastPeriod, string> = {
  24: '24h',
  72: '3 days',
  168: '7 days',
};

function WindBar({ speed }: { speed: number }) {
  const beaufort = windSpeedToBeaufort(speed);
  const pct = Math.min((beaufort / 12) * 100, 100);
  const color = beaufort <= 3 ? '#22c55e' : beaufort <= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className={styles.windBar}>
      <div className={styles.windBarFill} style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

interface ForecastTimelineProps {
  zoneId: string | null;
}

export default function ForecastTimeline({ zoneId }: ForecastTimelineProps) {
  const [period, setPeriod] = useState<ForecastPeriod>(24);
  const { data: forecast, isLoading } = useForecast(zoneId, period);

  // Sample every Nth point to avoid overcrowding
  const step = period === 24 ? 1 : period === 72 ? 3 : 8;
  const points = forecast?.points.filter((_, i) => i % step === 0) ?? [];

  return (
    <div className={styles.wrapper}>
      {/* Period tabs */}
      <div className={styles.tabs} role="tablist" aria-label="Forecast period">
        {([24, 72, 168] as ForecastPeriod[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            className={[styles.tab, period === p ? styles.tabActive : ''].join(' ')}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {!zoneId && <div className={styles.empty}>Select a zone to view forecast</div>}

      {zoneId && isLoading && (
        <div className={styles.loading}>
          <Spinner size="sm" />
          <span>Loading forecast...</span>
        </div>
      )}

      {zoneId && !isLoading && points.length === 0 && <SkeletonCard />}

      {points.length > 0 && (
        <div className={styles.timeline} role="list">
          {points.map((point, i) => {
            const beaufort = windSpeedToBeaufort(point.wind.speed);
            const safetyColor = beaufort <= 3 ? '#22c55e' : beaufort <= 5 ? '#f59e0b' : '#ef4444';

            return (
              <div key={i} className={styles.point} role="listitem">
                {/* Time */}
                <div className={styles.time}>
                  <div className={styles.timeMain}>
                    {period === 168 ? formatDate(point.timestamp) : formatTime(point.timestamp)}
                  </div>
                  {period === 72 && (
                    <div className={styles.timeSub}>{formatDate(point.timestamp)}</div>
                  )}
                </div>

                {/* Wind */}
                <div className={styles.wind}>
                  <span className={styles.windSpeed} style={{ color: safetyColor }}>
                    {point.wind.speed}kts
                  </span>
                  <span className={styles.windDir}>{degreesToCompass(point.wind.direction)}</span>
                  <WindBar speed={point.wind.speed} />
                </div>

                {/* Waves */}
                <div className={styles.waves}>
                  <span className={styles.waveHeight}>{point.waves.height.toFixed(1)}m</span>
                </div>

                {/* Weather */}
                <div className={styles.weather}>
                  <span className={styles.temp}>{point.weather.temperature}°</span>
                  <span className={styles.weatherDesc}>{point.weather.description}</span>
                </div>

                {/* Safety dot */}
                <div
                  className={styles.dot}
                  style={{ backgroundColor: safetyColor }}
                  aria-label={`Conditions: ${beaufort <= 3 ? 'safe' : beaufort <= 5 ? 'caution' : 'danger'}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
