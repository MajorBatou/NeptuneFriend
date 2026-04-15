import { useEffect } from 'react';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={[styles.toast, styles[type]].join(' ')} role="alert" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        {icons[type]}
      </span>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Dismiss notification">
        ✕
      </button>
    </div>
  );
}
