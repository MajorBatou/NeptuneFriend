import { useSailingStore } from '@/store';
import styles from './OfflineBanner.module.css';

export default function OfflineBanner() {
  const { isOffline } = useSailingStore();

  if (!isOffline) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <span className={styles.icon} aria-hidden="true">
        ⚡
      </span>
      <span className={styles.text}>You are offline — showing cached sailing data</span>
    </div>
  );
}
