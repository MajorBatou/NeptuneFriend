import styles from './MarineConditionsCard.module.css';

interface MarineData {
  windWave: {
    height: number;
    direction: number;
    period: number;
  };
  oceanCurrent: {
    velocity: number | null;
    direction: number | null;
    description: string | null;
  };
  seaSurfaceTemperature: number | null;
}

interface MarineConditionsCardProps {
  marine: MarineData;
}

function directionArrow(degrees: number): string {
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  return arrows[Math.round(degrees / 45) % 8];
}

function compassPoint(degrees: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(degrees / 45) % 8];
}

export default function MarineConditionsCard({ marine }: MarineConditionsCardProps) {
  const currentKnots =
    marine.oceanCurrent.velocity !== null
      ? (marine.oceanCurrent.velocity * 1.944).toFixed(1)
      : null;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>🌊 Marine Conditions</h3>
      <p className={styles.subtitle}>
        Open-Meteo Marine API — wind waves, currents & sea temperature
      </p>

      <div className={styles.grid}>
        {/* Wind Wave */}
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Wind Wave</div>
          <div className={styles.metricValue}>{marine.windWave.height}m</div>
          <div className={styles.metricSub}>
            {directionArrow(marine.windWave.direction)} {compassPoint(marine.windWave.direction)} ·{' '}
            {marine.windWave.period}s period
          </div>
        </div>

        {/* Sea Surface Temperature */}
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Sea Temperature</div>
          <div className={styles.metricValue}>
            {marine.seaSurfaceTemperature !== null ? `${marine.seaSurfaceTemperature}°C` : 'N/A'}
          </div>
          <div className={styles.metricSub}>Sea surface temperature</div>
        </div>

        {/* Ocean Current */}
        <div className={[styles.metric, styles.metricFull].join(' ')}>
          <div className={styles.metricLabel}>Ocean Current</div>
          {marine.oceanCurrent.velocity !== null ? (
            <>
              <div className={styles.metricValue}>{currentKnots} kts</div>
              <div className={styles.metricSub}>
                {marine.oceanCurrent.direction !== null &&
                  `${directionArrow(marine.oceanCurrent.direction)} ${compassPoint(marine.oceanCurrent.direction)} · `}
                {marine.oceanCurrent.description}
              </div>
            </>
          ) : (
            <div className={styles.metricSub}>Current data not available for this location</div>
          )}
        </div>
      </div>
    </div>
  );
}
