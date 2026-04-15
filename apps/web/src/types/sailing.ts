// Sailing data types for NeptuneFriend

export interface WindData {
  speed: number; // knots
  direction: number; // degrees (0-360)
  gust: number; // knots
  beaufort: number; // Beaufort scale 0-12
}

export interface WaveData {
  height: number; // meters
  period: number; // seconds
  direction: number; // degrees
  swellHeight: number; // meters
}

export interface TidalData {
  height: number; // meters
  nextHigh: string; // ISO timestamp
  nextLow: string; // ISO timestamp
  flow: 'ebb' | 'flood' | 'slack';
}

export interface WeatherConditions {
  temperature: number; // celsius
  visibility: number; // km
  cloudCover: number; // percentage
  precipitation: number; // mm/h
  pressure: number; // hPa
  humidity: number; // percentage
  description: string;
  icon: string;
}

export interface SailingConditions {
  id: string;
  zoneId: string;
  timestamp: string;
  wind: WindData;
  waves: WaveData;
  tides: TidalData;
  weather: WeatherConditions;
  safetyRating: 'safe' | 'caution' | 'danger';
  updatedAt: string;
}

export interface SailingZone {
  id: string;
  name: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  conditions?: SailingConditions;
  isFavorite: boolean;
}

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  conditions?: SailingConditions;
}

export interface SailingRoute {
  id: string;
  name: string;
  waypoints: Waypoint[];
  totalDistance: number; // nautical miles
  estimatedTime: number; // hours
  createdAt: string;
  updatedAt: string;
}

export interface ForecastPoint {
  timestamp: string;
  wind: WindData;
  waves: WaveData;
  weather: WeatherConditions;
}

export interface Forecast {
  zoneId: string;
  points: ForecastPoint[];
  generatedAt: string;
}

export interface Alert {
  id: string;
  userId: string;
  zoneId: string;
  zoneName: string;
  type: 'wind' | 'wave' | 'storm' | 'fog' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  threshold: number;
  message: string;
  triggeredAt: string;
  read: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  favoriteZones: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  units: 'metric' | 'imperial' | 'nautical';
  windSpeedUnit: 'knots' | 'mph' | 'kmh' | 'ms';
  temperatureUnit: 'celsius' | 'fahrenheit';
  defaultZoom: number;
  notificationsEnabled: boolean;
}

// Beaufort scale helper
export const BEAUFORT_DESCRIPTIONS: Record<number, string> = {
  0: 'Calm',
  1: 'Light air',
  2: 'Light breeze',
  3: 'Gentle breeze',
  4: 'Moderate breeze',
  5: 'Fresh breeze',
  6: 'Strong breeze',
  7: 'Near gale',
  8: 'Gale',
  9: 'Strong gale',
  10: 'Storm',
  11: 'Violent storm',
  12: 'Hurricane',
};

export type SafetyRating = 'safe' | 'caution' | 'danger';
export type AlertSeverity = 'info' | 'warning' | 'critical';
