import type { WeatherConditions } from '@/types';
import styles from './WeatherStrip.module.css';

interface WeatherStripProps {
  weather: WeatherConditions;
}

export default function WeatherStrip({ weather }: WeatherStripProps) {
  const stats = [
    { label: 'Temp', value: `${weather.temperature}°C` },
    { label: 'Visibility', value: `${weather.visibility}km` },
    { label: 'Humidity', value: `${weather.humidity}%` },
    { label: 'Pressure', value: `${weather.pressure}hPa` },
    { label: 'Cloud', value: `${weather.cloudCover}%` },
    { label: 'Rain', value: `${weather.precipitation}mm/h` },
  ];

  return (
    <div className={styles.strip}>
      <div className={styles.description}>
        <span className={styles.icon} aria-hidden="true">
          {getWeatherIcon(weather.description)}
        </span>
        <span className={styles.desc}>{weather.description}</span>
      </div>

      <div className={styles.stats}>
        {stats.map(({ label, value }) => (
          <div key={label} className={styles.stat}>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statValue}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getWeatherIcon(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('sun') || desc.includes('clear')) return '☀️';
  if (desc.includes('cloud')) return '⛅';
  if (desc.includes('rain') || desc.includes('shower')) return '🌧️';
  if (desc.includes('storm') || desc.includes('thunder')) return '⛈️';
  if (desc.includes('fog') || desc.includes('mist')) return '🌫️';
  if (desc.includes('snow')) return '🌨️';
  if (desc.includes('wind')) return '💨';
  return '🌤️';
}
