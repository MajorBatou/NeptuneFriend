import { useAlertStore } from '@/store';
import { Button } from '@/components/ui';
import { formatTime, formatDate } from '@/utils/sailing';
import type { AlertSeverity } from '@/types';
import styles from './AlertHistory.module.css';

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; icon: string }> = {
  info: { color: '#0c447c', bg: '#e6f1fb', icon: 'i' },
  warning: { color: '#a16207', bg: '#fef9c3', icon: '!' },
  critical: { color: '#dc2626', bg: '#fee2e2', icon: 'X' },
};

export default function AlertHistory() {
  const { alerts, markAsRead, markAllAsRead, deleteAlert, clearAllAlerts, unreadCount } =
    useAlertStore();

  if (alerts.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No alerts yet</p>
        <p className={styles.emptySubText}>
          Configure alerts above to get notified about sailing conditions
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>Alert history</h3>
          {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount} new</span>}
        </div>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllAlerts}>
            Clear all
          </Button>
        </div>
      </div>

      <ul className={styles.list}>
        {alerts.map((alert) => {
          const config = SEVERITY_CONFIG[alert.severity];
          return (
            <li
              key={alert.id}
              className={[styles.item, !alert.read ? styles.itemUnread : ''].join(' ')}
              onClick={() => !alert.read && markAsRead(alert.id)}
            >
              <div
                className={styles.severityIcon}
                style={{ backgroundColor: config.bg, color: config.color }}
                aria-label={`Severity: ${alert.severity}`}
              >
                {config.icon}
              </div>

              <div className={styles.content}>
                <div className={styles.itemHeader}>
                  <span className={styles.zoneName}>{alert.zoneName}</span>
                  <span className={styles.severity} style={{ color: config.color }}>
                    {alert.severity}
                  </span>
                </div>
                <p className={styles.message}>{alert.message}</p>
                <div className={styles.meta}>
                  <span>{formatDate(alert.triggeredAt)}</span>
                  <span className={styles.metaSep}>·</span>
                  <span>{formatTime(alert.triggeredAt)}</span>
                  <span className={styles.metaSep}>·</span>
                  <span className={styles.alertType}>{alert.type}</span>
                </div>
              </div>

              {!alert.read && <div className={styles.unreadDot} aria-label="Unread" />}

              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAlert(alert.id);
                }}
                aria-label="Dismiss alert"
              >
                x
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
