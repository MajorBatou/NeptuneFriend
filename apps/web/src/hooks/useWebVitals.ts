import { useEffect } from 'react';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

function getRating(name: string, value: number): WebVitalMetric['rating'] {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000], // ms
    INP: [200, 500], // ms
    CLS: [0.1, 0.25], // unitless
    FCP: [1800, 3000], // ms
    TTFB: [800, 1800], // ms
  };

  const [good, poor] = thresholds[name] ?? [0, Infinity];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: WebVitalMetric) {
  // In production this would send to your analytics endpoint
  // For now log to console in development
  if (import.meta.env.DEV) {
    // In dev, dispatch a custom event so DevTools can pick it up
    window.dispatchEvent(new CustomEvent('web-vitals', { detail: metric }));
  }

  // Send to API endpoint for monitoring (Day 25 — Prometheus integration)
  if (import.meta.env.VITE_APP_ENV === 'production') {
    fetch('/api/metrics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
      keepalive: true,
    }).catch(() => {
      // Silently fail — metrics are non-critical
    });
  }
}

export function useWebVitals() {
  useEffect(() => {
    // Use PerformanceObserver for LCP, CLS, INP
    if (!('PerformanceObserver' in window)) return;

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        const value = lastEntry.startTime;
        sendToAnalytics({ name: 'LCP', value, rating: getRating('LCP', value) });
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // Not supported
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
          };
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
          }
        }
        sendToAnalytics({ name: 'CLS', value: clsValue, rating: getRating('CLS', clsValue) });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Not supported
    }

    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            sendToAnalytics({
              name: 'FCP',
              value: entry.startTime,
              rating: getRating('FCP', entry.startTime),
            });
          }
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch {
      // Not supported
    }

    // Time to First Byte
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        sendToAnalytics({ name: 'TTFB', value: ttfb, rating: getRating('TTFB', ttfb) });
      }
    } catch {
      // Not supported
    }
  }, []);
}
