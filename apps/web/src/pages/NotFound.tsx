import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import styles from './NotFound.module.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.content}>
        <div className={styles.code} aria-hidden="true">
          404
        </div>
        <h1 id="not-found-title" className={styles.title}>
          Page not found
        </h1>
        <p className={styles.message}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </div>
    </main>
  );
}
