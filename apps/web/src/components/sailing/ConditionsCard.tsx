import type { SailingConditions } from '@/types';
import Card, { CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import WindIndicator from './WindIndicator';
import WaveCard from './WaveCard';
import SafetyBadge from './SafetyBadge';
import { formatTime } from '@/utils/sailing';
import styles from './ConditionsCard.module.css';

interface ConditionsCardProps {
  conditions: SailingConditions;
  zoneName: string;
}

export default function ConditionsCard({ conditions, zoneName }: ConditionsCardProps) {
  return (
    <Card variant="elevated" padding="md">
      <CardHeader>
        <CardTitle>{zoneName}</CardTitle>
        <SafetyBadge rating={conditions.safetyRating} size="sm" />
      </CardHeader>

      <CardBody>
        <div className={styles.grid}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Wind</h4>
            <WindIndicator wind={conditions.wind} size="md" />
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Waves</h4>
            <WaveCard waves={conditions.waves} />
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Weather</h4>
            <div className={styles.weatherRow}>
              <span className={styles.weatherValue}>{conditions.weather.temperature}°C</span>
              <span className={styles.weatherDesc}>{conditions.weather.description}</span>
            </div>
            <div className={styles.weatherRow}>
              <span className={styles.weatherLabel}>Visibility</span>
              <span className={styles.weatherValue}>{conditions.weather.visibility} km</span>
            </div>
            <div className={styles.weatherRow}>
              <span className={styles.weatherLabel}>Pressure</span>
              <span className={styles.weatherValue}>{conditions.weather.pressure} hPa</span>
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Tides</h4>
            <div className={styles.tideRow}>
              <span className={styles.tideFlow}>{conditions.tides.flow}</span>
              <span className={styles.tideHeight}>{conditions.tides.height.toFixed(1)}m</span>
            </div>
            <div className={styles.weatherRow}>
              <span className={styles.weatherLabel}>Next high</span>
              <span className={styles.weatherValue}>{formatTime(conditions.tides.nextHigh)}</span>
            </div>
            <div className={styles.weatherRow}>
              <span className={styles.weatherLabel}>Next low</span>
              <span className={styles.weatherValue}>{formatTime(conditions.tides.nextLow)}</span>
            </div>
          </div>
        </div>

        <div className={styles.updated}>Updated {formatTime(conditions.updatedAt)}</div>
      </CardBody>
    </Card>
  );
}
