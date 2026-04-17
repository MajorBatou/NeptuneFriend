// Sailing data types for NeptuneFriend

export type SeaState =
  | 'glassy'
  | 'calm'
  | 'smooth'
  | 'slight'
  | 'moderate'
  | 'rough'
  | 'very-rough'
  | 'high'
  | 'very-high'
  | 'phenomenal'
  | 'confused';

export interface SwellData {
  height: number; // meters
  period: number; // seconds
  direction: number; // degrees (0-360)
  steepness: number; // height/period ratio — >0.04 = breaking wave risk
}

export interface WindData {
  speed: number; // knots
  direction: number; // degrees (0-360)
  gust: number; // knots
  beaufort: number; // Beaufort scale 0-12
}

export interface WaveData {
  height: number; // total significant wave height (meters)
  period: number; // dominant period (seconds)
  direction: number; // dominant direction (degrees)
  primarySwell: SwellData;
  secondarySwell?: SwellData;
  seaState: SeaState;
  confusedSea: boolean; // true when swells within 45° of each other
  swellAngle?: number; // angle between primary and secondary swell
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

export interface ModelContribution {
  model: string;
  weight: number;
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
  models: ModelContribution[]; // which models contributed
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
  models: string[]; // models used for this forecast
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

export const SEA_STATE_DESCRIPTIONS: Record<SeaState, string> = {
  glassy: 'Glassy (0-0.1m)',
  calm: 'Calm (0.1-0.5m)',
  smooth: 'Smooth (0.5-1.25m)',
  slight: 'Slight (1.25-2.5m)',
  moderate: 'Moderate (2.5-4m)',
  rough: 'Rough (4-6m)',
  'very-rough': 'Very rough (6-9m)',
  high: 'High (9-14m)',
  'very-high': 'Very high (14m+)',
  phenomenal: 'Phenomenal (>14m)',
  confused: 'Confused seas',
};

export type SafetyRating = 'safe' | 'caution' | 'danger';
export type AlertSeverity = 'info' | 'warning' | 'critical';
