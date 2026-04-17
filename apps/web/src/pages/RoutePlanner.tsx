import { RouteMap, RoutePanel } from '@/components/planner';
import styles from './RoutePlanner.module.css';

export default function RoutePlanner() {
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <RoutePanel />
      </aside>
      <main className={styles.mapArea}>
        <RouteMap />
      </main>
    </div>
  );
}
