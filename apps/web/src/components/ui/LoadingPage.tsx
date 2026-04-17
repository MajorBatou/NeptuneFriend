import { Spinner } from '@/components/ui';
import styles from './LoadingPage.module.css';

interface LoadingPageProps {
  message?: string;
}

export default function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className={styles.page} role="status" aria-live="polite" aria-label={message}>
      <Spinner size="lg" />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
