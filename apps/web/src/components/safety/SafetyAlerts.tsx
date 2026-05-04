import styles from './SafetyAlerts.module.css';

interface Wind {
  beaufort: number;
  speed: number;
}

interface Waves {
  height: number;
  confusedSea?: boolean;
  swellAngle?: number;
}

interface Weather {
  pressure: number;
}

interface OceanCurrent {
  velocity: number | null;
  direction: number | null;
  description: string | null;
}

interface MarineData {
  oceanCurrent: OceanCurrent;
}

interface SafetyAlertsProps {
  wind: Wind;
  waves: Waves;
  weather: Weather;
  marine?: MarineData | null;
}

interface Alert {
  id: string;
  level: 'warning' | 'danger';
  icon: string;
  title: string;
  message: string;
}

function getAlerts(
  wind: Wind,
  waves: Waves,
  weather: Weather,
  marine?: MarineData | null
): Alert[] {
  const alerts: Alert[] = [];
  const angle = waves.swellAngle ?? 45;

  // 1 — Confused sea warning
  if (waves.confusedSea && wind.beaufort >= 7 && waves.height >= 2.5) {
    alerts.push({
      id: 'confused-sea',
      level: 'danger',
      icon: '🌀',
      title: 'Confused Sea Warning',
      message: `Primary and secondary swells converging at ${angle}° with Force ${wind.beaufort} winds and ${waves.height}m seas. Unpredictable breaking waves — extreme danger. Do not sail.`,
    });
  } else if (waves.confusedSea && wind.beaufort >= 5 && waves.height >= 1.5) {
    alerts.push({
      id: 'confused-sea-moderate',
      level: 'warning',
      icon: '🌀',
      title: 'Confused Sea Advisory',
      message: `Crossing swells at ${angle}° creating irregular wave patterns in ${waves.height}m seas. Use caution — conditions may deteriorate rapidly.`,
    });
  }

  // 2 — Low barometric pressure
  if (weather.pressure < 970) {
    alerts.push({
      id: 'very-low-pressure',
      level: 'danger',
      icon: '📉',
      title: 'Extremely Low Pressure',
      message: `Barometric pressure at ${weather.pressure} hPa — storm force conditions likely. Seek shelter immediately.`,
    });
  } else if (weather.pressure < 985) {
    alerts.push({
      id: 'low-pressure',
      level: 'danger',
      icon: '📉',
      title: 'Very Low Pressure Warning',
      message: `Barometric pressure at ${weather.pressure} hPa — severe storm conditions. Do not put to sea.`,
    });
  } else if (weather.pressure < 1000) {
    alerts.push({
      id: 'below-1000',
      level: 'warning',
      icon: '📉',
      title: 'Low Pressure Advisory',
      message: `Barometric pressure at ${weather.pressure} hPa — below 1000 hPa threshold. Monitor conditions closely. Storm possible.`,
    });
  }

  // 3 — High Beaufort
  if (wind.beaufort >= 12) {
    alerts.push({
      id: 'hurricane',
      level: 'danger',
      icon: '🌪️',
      title: 'Hurricane Force Winds',
      message: `Force ${wind.beaufort} winds (${wind.speed} knots). Hurricane conditions — all vessels should be in harbour.`,
    });
  } else if (wind.beaufort >= 10) {
    alerts.push({
      id: 'storm-force',
      level: 'danger',
      icon: '⛈️',
      title: 'Storm Force Winds',
      message: `Force ${wind.beaufort} winds (${wind.speed} knots). Storm force — extremely dangerous for all vessels.`,
    });
  } else if (wind.beaufort >= 8) {
    alerts.push({
      id: 'gale',
      level: 'warning',
      icon: '💨',
      title: 'Gale Warning',
      message: `Force ${wind.beaufort} winds (${wind.speed} knots). Gale conditions — small craft should not put to sea.`,
    });
  }

  // 4 — Extreme wave height
  if (waves.height >= 9) {
    alerts.push({
      id: 'extreme-waves',
      level: 'danger',
      icon: '🌊',
      title: 'Extreme Wave Height',
      message: `Significant wave height ${waves.height}m — phenomenal seas. Survival conditions for most vessels.`,
    });
  } else if (waves.height >= 4) {
    alerts.push({
      id: 'rough-seas',
      level: 'warning',
      icon: '🌊',
      title: 'Rough Seas Advisory',
      message: `Significant wave height ${waves.height}m. Rough to very rough seas — small craft advisory in effect.`,
    });
  }

  // 5 — Ocean current warnings
  if (marine?.oceanCurrent?.velocity !== null && marine?.oceanCurrent?.velocity !== undefined) {
    const knots = marine.oceanCurrent.velocity * 1.944;
    const dir = marine.oceanCurrent.description ?? '';

    if (knots >= 8) {
      alerts.push({
        id: 'extreme-current',
        level: 'danger',
        icon: '🔄',
        title: 'Extreme Ocean Current',
        message: `Current running at ${knots.toFixed(1)} knots. ${dir}. Extreme danger — vessel control severely compromised. Do not sail.`,
      });
    } else if (knots >= 5) {
      alerts.push({
        id: 'very-strong-current',
        level: 'danger',
        icon: '🔄',
        title: 'Very Strong Current Warning',
        message: `Current running at ${knots.toFixed(1)} knots. ${dir}. Very strong — anchoring difficult, manoeuvring restricted.`,
      });
    } else if (knots >= 3) {
      alerts.push({
        id: 'strong-current',
        level: 'warning',
        icon: '🔄',
        title: 'Strong Current Advisory',
        message: `Current running at ${knots.toFixed(1)} knots. ${dir}. Allow extra time and fuel for passages against the current.`,
      });
    }
  }

  return alerts;
}

export default function SafetyAlerts({ wind, waves, weather, marine }: SafetyAlertsProps) {
  const alerts = getAlerts(wind, waves, weather, marine);

  if (alerts.length === 0) return null;

  return (
    <div className={styles.container}>
      {alerts.map((alert) => (
        <div key={alert.id} className={[styles.alert, styles[alert.level]].join(' ')} role="alert">
          <div className={styles.alertHeader}>
            <span className={styles.alertIcon}>{alert.icon}</span>
            <span className={styles.alertTitle}>{alert.title}</span>
            <span className={styles.alertBadge}>
              {alert.level === 'danger' ? 'DANGER' : 'WARNING'}
            </span>
          </div>
          <p className={styles.alertMessage}>{alert.message}</p>
        </div>
      ))}
    </div>
  );
}
