import type { WindData, SafetyRating } from '@/types';
import { BEAUFORT_DESCRIPTIONS } from '@/types';

// Convert wind speed to Beaufort scale
export function windSpeedToBeaufort(speedKnots: number): number {
  if (speedKnots < 1) return 0;
  if (speedKnots < 4) return 1;
  if (speedKnots < 7) return 2;
  if (speedKnots < 11) return 3;
  if (speedKnots < 16) return 4;
  if (speedKnots < 22) return 5;
  if (speedKnots < 28) return 6;
  if (speedKnots < 34) return 7;
  if (speedKnots < 41) return 8;
  if (speedKnots < 48) return 9;
  if (speedKnots < 56) return 10;
  if (speedKnots < 64) return 11;
  return 12;
}

// Get Beaufort description
export function getBeaufortDescription(beaufort: number): string {
  return BEAUFORT_DESCRIPTIONS[beaufort] ?? 'Unknown';
}

// Convert degrees to compass direction
export function degreesToCompass(degrees: number): string {
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Get safety rating color
export function getSafetyColor(rating: SafetyRating): string {
  switch (rating) {
    case 'safe':
      return 'var(--color-wind-calm)';
    case 'caution':
      return 'var(--color-wind-moderate)';
    case 'danger':
      return 'var(--color-wind-strong)';
  }
}

// Calculate safety rating from wind and wave data
export function calculateSafetyRating(wind: WindData, waveHeight: number): SafetyRating {
  if (wind.beaufort >= 7 || waveHeight >= 3) return 'danger';
  if (wind.beaufort >= 5 || waveHeight >= 1.5) return 'caution';
  return 'safe';
}

// Format distance in nautical miles
export function formatNauticalMiles(nm: number): string {
  return `${nm.toFixed(1)} nm`;
}

// Format wind speed with unit
export function formatWindSpeed(
  knots: number,
  unit: 'knots' | 'mph' | 'kmh' | 'ms' = 'knots'
): string {
  switch (unit) {
    case 'mph':
      return `${(knots * 1.151).toFixed(0)} mph`;
    case 'kmh':
      return `${(knots * 1.852).toFixed(0)} km/h`;
    case 'ms':
      return `${(knots * 0.514).toFixed(1)} m/s`;
    default:
      return `${knots.toFixed(0)} kts`;
  }
}

// Format wave height
export function formatWaveHeight(meters: number): string {
  return `${meters.toFixed(1)}m`;
}

// Format timestamp to local time
export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format timestamp to local date
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
