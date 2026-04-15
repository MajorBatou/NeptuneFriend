import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function Spinner({ size = 'md', label = 'Loading...' }: SpinnerProps) {
  return (
    <div className={styles.wrapper} role="status" aria-label={label}>
      <div className={[styles.spinner, styles[size]].join(' ')} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}
