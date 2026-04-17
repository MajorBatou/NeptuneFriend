// Base interface all weather providers must implement

export interface ProviderWindData {
  speed: number; // knots
  direction: number; // degrees
  gust: number; // knots
  beaufort: number;
}

export interface ProviderSwellData {
  height: number; // meters
  period: number; // seconds
  direction: number; // degrees
  steepness: number; // height/period
}

export interface ProviderWaveData {
  height: number;
  period: number;
  direction: number;
  primarySwell: ProviderSwellData;
  secondarySwell?: ProviderSwellData;
}

export interface ProviderWeatherData {
  temperature: number;
  visibility: number;
  cloudCover: number;
  precipitation: number;
  pressure: number;
  humidity: number;
  description: string;
}

export interface ProviderConditions {
  wind: ProviderWindData;
  waves: ProviderWaveData;
  weather: ProviderWeatherData;
  timestamp: string;
  model: string;
}

export interface ProviderForecastPoint extends ProviderConditions {
  forecastHour: number;
}

export interface WeatherProvider {
  readonly name: string;
  readonly model: string;
  readonly supportsRegion: (lat: number, lng: number) => boolean;
  readonly priority: number; // higher = more trusted

  getConditions(lat: number, lng: number): Promise<ProviderConditions>;
  getForecast(lat: number, lng: number, hours: number): Promise<ProviderForecastPoint[]>;
}

// Helper: convert m/s to knots
export function msToKnots(ms: number): number {
  return Math.round(ms * 1.944);
}

// Helper: calculate Beaufort from knots
export function knotsToBeaufort(knots: number): number {
  if (knots < 1) return 0;
  if (knots < 4) return 1;
  if (knots < 7) return 2;
  if (knots < 11) return 3;
  if (knots < 16) return 4;
  if (knots < 22) return 5;
  if (knots < 28) return 6;
  if (knots < 34) return 7;
  if (knots < 41) return 8;
  if (knots < 48) return 9;
  if (knots < 56) return 10;
  if (knots < 64) return 11;
  return 12;
}

// Helper: calculate swell steepness
export function calcSteepness(height: number, period: number): number {
  if (period === 0) return 0;
  return Math.round((height / period) * 1000) / 1000;
}
