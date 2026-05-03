import { OpenMeteoMarineProvider, MarineConditions } from './providers/OpenMeteoMarineProvider.js';
import { weatherCache } from './WeatherCache.js';

const marineProvider = new OpenMeteoMarineProvider();

export interface MarineData {
  windWave: {
    height: number;
    direction: number;
    period: number;
  };
  oceanCurrent: {
    velocity: number | null;
    direction: number | null;
    description: string | null;
  };
  seaSurfaceTemperature: number | null;
}

function describeCurrents(velocity: number | null, direction: number | null): string | null {
  if (velocity === null || direction === null) return null;
  const speed = velocity * 1.944; // m/s to knots
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const dir = dirs[Math.round(direction / 45) % 8];

  if (speed < 0.5) return `Negligible current (${dir})`;
  if (speed < 1) return `Weak current — ${speed.toFixed(1)} knots ${dir}`;
  if (speed < 2) return `Moderate current — ${speed.toFixed(1)} knots ${dir}`;
  if (speed < 3) return `Strong current — ${speed.toFixed(1)} knots ${dir}`;
  return `Very strong current — ${speed.toFixed(1)} knots ${dir}`;
}

export async function getMarineData(lat: number, lng: number): Promise<MarineData | null> {
  const cacheKey = `marine:${lat.toFixed(2)}:${lng.toFixed(2)}`;

  try {
    // Check cache first
    const cached = await weatherCache.getConditions(cacheKey);
    if (cached) return JSON.parse(cached) as MarineData;

    const marine: MarineConditions = await marineProvider.getMarineConditions(lat, lng);

    const result: MarineData = {
      windWave: {
        height: Math.round(marine.windWaveHeight * 10) / 10,
        direction: Math.round(marine.windWaveDirection),
        period: Math.round(marine.windWavePeriod * 10) / 10,
      },
      oceanCurrent: {
        velocity: marine.oceanCurrentVelocity,
        direction: marine.oceanCurrentDirection,
        description: describeCurrents(marine.oceanCurrentVelocity, marine.oceanCurrentDirection),
      },
      seaSurfaceTemperature:
        marine.seaSurfaceTemperature !== null
          ? Math.round(marine.seaSurfaceTemperature * 10) / 10
          : null,
    };

    // Cache for 1 hour
    await weatherCache.setConditions(cacheKey, JSON.stringify(result));
    return result;
  } catch {
    return null;
  }
}
