import { describe, it, expect } from 'vitest';
import {
  windSpeedToBeaufort,
  degreesToCompass,
  calculateSafetyRating,
  formatWindSpeed,
  formatWaveHeight,
  calculateDistance,
} from '../utils/sailing';

describe('windSpeedToBeaufort', () => {
  it('returns 0 for calm', () => expect(windSpeedToBeaufort(0)).toBe(0));
  it('returns 4 for moderate breeze', () => expect(windSpeedToBeaufort(13)).toBe(4));
  it('returns 8 for gale', () => expect(windSpeedToBeaufort(38)).toBe(8));
  it('returns 12 for hurricane', () => expect(windSpeedToBeaufort(70)).toBe(12));
});

describe('degreesToCompass', () => {
  it('returns N for 0 degrees', () => expect(degreesToCompass(0)).toBe('N'));
  it('returns E for 90 degrees', () => expect(degreesToCompass(90)).toBe('E'));
  it('returns S for 180 degrees', () => expect(degreesToCompass(180)).toBe('S'));
  it('returns W for 270 degrees', () => expect(degreesToCompass(270)).toBe('W'));
});

describe('calculateSafetyRating', () => {
  const baseWind = { speed: 10, direction: 180, gust: 12, beaufort: 3 };

  it('returns safe for calm conditions', () => {
    expect(calculateSafetyRating(baseWind, 0.3)).toBe('safe');
  });

  it('returns caution for moderate conditions', () => {
    const wind = { ...baseWind, beaufort: 5 };
    expect(calculateSafetyRating(wind, 1.0)).toBe('caution');
  });

  it('returns danger for high beaufort', () => {
    const wind = { ...baseWind, beaufort: 8 };
    expect(calculateSafetyRating(wind, 1.0)).toBe('danger');
  });

  it('returns danger for high waves', () => {
    expect(calculateSafetyRating(baseWind, 4.0)).toBe('danger');
  });
});

describe('formatWindSpeed', () => {
  it('formats knots by default', () => expect(formatWindSpeed(15)).toBe('15 kts'));
  it('formats mph', () => expect(formatWindSpeed(15, 'mph')).toBe('17 mph'));
  it('formats km/h', () => expect(formatWindSpeed(15, 'kmh')).toBe('28 km/h'));
});

describe('formatWaveHeight', () => {
  it('formats wave height in meters', () => expect(formatWaveHeight(1.5)).toBe('1.5m'));
});

describe('calculateDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(calculateDistance(51.5, -0.1, 51.5, -0.1)).toBe(0);
  });

  it('returns positive distance for different coordinates', () => {
    const distance = calculateDistance(51.5, -0.1, 52.5, -0.1);
    expect(distance).toBeGreaterThan(0);
  });
});
