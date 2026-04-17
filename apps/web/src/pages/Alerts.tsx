import { AlertConfigurator } from '@/components/alerts';
import { AlertHistory } from '@/components/alerts';
import { useAlertStore } from '@/store';
import styles from './Alerts.module.css';

export default function Alerts() {
  const { unreadCount } = useAlertStore();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Alerts</h1>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </div>
        <p className={styles.subtitle}>
          Configure wind, wave and storm alerts for your sailing zones
        </p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <AlertConfigurator />
        </section>

        <section className={styles.section}>
          <AlertHistory />
        </section>
      </div>
    </div>
  );
}
