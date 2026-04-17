import { usePlannerStore } from '@/store';
import { formatNauticalMiles } from '@/utils/sailing';
import styles from './RouteSummary.module.css';

interface RouteSummaryProps {
  avgSpeed?: number;
}

export default function RouteSummary({ avgSpeed = 6 }: RouteSummaryProps) {
  const { getDraftDistance, getDraftEstimatedTime, draftWaypoints } = usePlannerStore();

  const distance = getDraftDistance();
  const hours = getDraftEstimatedTime(avgSpeed);
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (draftWaypoints.length < 2) return null;

  return (
    <div className={styles.summary}>
      <div className={styles.stat}>
        <span className={styles.statLabel}>Distance</span>
        <span className={styles.statValue}>{formatNauticalMiles(distance)}</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.stat}>
        <span className={styles.statLabel}>Est. time</span>
        <span className={styles.statValue}>
          {wholeHours > 0 ? `${wholeHours}h ` : ''}
          {minutes}m
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.stat}>
        <span className={styles.statLabel}>Waypoints</span>
        <span className={styles.statValue}>{draftWaypoints.length}</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.stat}>
        <span className={styles.statLabel}>Avg speed</span>
        <span className={styles.statValue}>{avgSpeed} kts</span>
      </div>
    </div>
  );
}
