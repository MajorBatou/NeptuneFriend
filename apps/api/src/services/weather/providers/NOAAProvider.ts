import axios from 'axios';
import type { TidalResult } from './WorldTidesProvider.js';

const BASE_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

// Find nearest NOAA station by lat/lng
function findNearestStation(lat: number, lng: number): string | null {
  const stationLocations: Record<string, [number, number]> = {
    '8638610': [36.95, -76.33],
    '8518750': [40.7, -74.01],
    '8443970': [42.36, -71.05],
    '8557380': [38.78, -75.12],
    '8665530': [32.78, -79.93],
    '8724580': [24.56, -81.81],
    '9414290': [37.81, -122.47],
    '9447130': [47.6, -122.34],
    '9413450': [36.6, -121.89],
    '9410170': [32.71, -117.17],
    '8726520': [27.76, -82.63],
    '8771341': [29.31, -94.79],
    '8761724': [29.27, -89.96],
  };

  // Check if coordinates are in US region
  const isUS = lat >= 24 && lat <= 50 && lng >= -130 && lng <= -65;
  if (!isUS) return null;

  // Find nearest station
  let nearest = '';
  let minDist = Infinity;

  for (const [stationId, [sLat, sLng]] of Object.entries(stationLocations)) {
    const dist = Math.sqrt((lat - sLat) ** 2 + (lng - sLng) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = stationId;
    }
  }

  // Only use if within ~3 degrees (~300km)
  return minDist < 3 ? nearest : null;
}

export class NOAAProvider {
  readonly name = 'NOAA Tides & Currents';

  supportsRegion(lat: number, lng: number): boolean {
    return findNearestStation(lat, lng) !== null;
  }

  async getTides(lat: number, lng: number): Promise<TidalResult> {
    const stationId = findNearestStation(lat, lng);
    if (!stationId) return this.getFallbackTides();

    try {
      const now = new Date();
      const beginDate = now.toISOString().slice(0, 10).replace(/-/g, '');
      const endDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');

      const [heightRes, predictionsRes] = await Promise.all([
        // Current water level
        axios.get(BASE_URL, {
          params: {
            begin_date: beginDate,
            end_date: beginDate,
            station: stationId,
            product: 'water_level',
            datum: 'MLLW',
            time_zone: 'GMT',
            interval: 'h',
            units: 'metric',
            application: 'neptunefriend',
            format: 'json',
          },
          timeout: 8000,
        }),
        // Hi/Lo predictions
        axios.get(BASE_URL, {
          params: {
            begin_date: beginDate,
            end_date: endDate,
            station: stationId,
            product: 'predictions',
            datum: 'MLLW',
            time_zone: 'GMT',
            interval: 'hilo',
            units: 'metric',
            application: 'neptunefriend',
            format: 'json',
          },
          timeout: 8000,
        }),
      ]);

      const currentLevel = heightRes.data?.data?.[0]?.v;
      const predictions = predictionsRes.data?.predictions ?? [];

      const nowTime = now.getTime();
      const futurePredictions = predictions.filter(
        (p: { t: string }) => new Date(p.t).getTime() > nowTime
      );

      const nextHigh = futurePredictions.find((p: { type: string }) => p.type === 'H');
      const nextLow = futurePredictions.find((p: { type: string }) => p.type === 'L');

      // Determine flow
      const prevPrediction = predictions
        .filter((p: { t: string }) => new Date(p.t).getTime() <= nowTime)
        .pop();

      let flow: 'ebb' | 'flood' | 'slack' = 'slack';
      if (prevPrediction) {
        const timeSince = nowTime - new Date(prevPrediction.t).getTime();
        if (timeSince < 30 * 60 * 1000) {
          flow = 'slack';
        } else if (prevPrediction.type === 'L') {
          flow = 'flood';
        } else {
          flow = 'ebb';
        }
      }

      return {
        height: currentLevel ? Math.round(parseFloat(currentLevel) * 10) / 10 : 1.5,
        nextHigh: nextHigh
          ? new Date(nextHigh.t).toISOString()
          : new Date(nowTime + 6 * 3600000).toISOString(),
        nextLow: nextLow
          ? new Date(nextLow.t).toISOString()
          : new Date(nowTime + 3 * 3600000).toISOString(),
        flow,
      };
    } catch {
      return this.getFallbackTides();
    }
  }

  private getFallbackTides(): TidalResult {
    const now = Date.now();
    return {
      height: 1.5,
      nextHigh: new Date(now + 6 * 3600000).toISOString(),
      nextLow: new Date(now + 12 * 3600000).toISOString(),
      flow: 'flood',
    };
  }
}
