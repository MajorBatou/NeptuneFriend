import { HTMLAttributes } from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'safe' | 'caution' | 'danger' | 'info' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export default function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[variant], styles[size], className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
