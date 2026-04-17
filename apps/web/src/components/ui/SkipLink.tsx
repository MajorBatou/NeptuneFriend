import styles from './SkipLink.module.css';

export default function SkipLink() {
  return (
    <a href="#main-content" className={styles.skip}>
      Skip to main content
    </a>
  );
}
