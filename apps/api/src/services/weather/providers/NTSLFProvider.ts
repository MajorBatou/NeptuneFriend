import axios from 'axios';
import type { TidalResult } from './WorldTidesProvider.js';

const BASE_URL = 'https://www.ntslf.org/tides/tidepred';

// NTSLF station IDs for UK/Ireland zones
// Format: port name used in the API
const NTSLF_STATIONS: Record<string, { id: string; lat: number; lng: number }> = {
  Portsmouth: { id: 'Portsmouth', lat: 50.8, lng: -1.1 },
  Southampton: { id: 'Southampton', lat: 50.9, lng: -1.4 },
  Sheerness: { id: 'Sheerness', lat: 51.44, lng: 0.74 },
  Avonmouth: { id: 'Avonmouth', lat: 51.51, lng: -2.71 },
  Millport: { id: 'Millport', lat: 55.75, lng: -4.93 },
  Dublin: { id: 'Dublin', lat: 53.33, lng: -6.2 },
  Devonport: { id: 'Devonport', lat: 50.37, lng: -4.19 },
  Fishguard: { id: 'Fishguard', lat: 52.01, lng: -4.98 },
};

function findNearestStation(lat: number, lng: number): string | null {
  // UK and Ireland bounding box
  const isUK = lat >= 49.5 && lat <= 61.5 && lng >= -12.0 && lng <= 3.0;
  if (!isUK) return null;

  let nearest = '';
  let minDist = Infinity;

  for (const [name, { lat: sLat, lng: sLng }] of Object.entries(NTSLF_STATIONS)) {
    const dist = Math.sqrt((lat - sLat) ** 2 + (lng - sLng) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = name;
    }
  }

  return minDist < 3 ? nearest : null;
}

export class NTSLFProvider {
  readonly name = 'NTSLF (UK Tides)';

  supportsRegion(lat: number, lng: number): boolean {
    return findNearestStation(lat, lng) !== null;
  }

  async getTides(lat: number, lng: number): Promise<TidalResult> {
    const stationName = findNearestStation(lat, lng);
    if (!stationName) return this.getFallbackTides();

    const station = NTSLF_STATIONS[stationName];
    if (!station) return this.getFallbackTides();

    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);

      const { data } = await axios.get(BASE_URL, {
        params: {
          port: station.id,
          date: dateStr,
          zone: 'UT',
        },
        timeout: 8000,
        headers: { 'User-Agent': 'NeptuneFriend/1.0' },
      });

      // Parse NTSLF response — returns text format
      const lines = (data as string).split('\n').filter((l: string) => l.trim());
      const predictions: { time: Date; height: number; type: string }[] = [];

      for (const line of lines) {
        const match = line.match(/(\d{2}:\d{2})\s+([\d.]+)\s+(HW|LW)/);
        if (match) {
          const [, time, height, type] = match;
          const [hours, minutes] = time.split(':').map(Number);
          const predTime = new Date(now);
          predTime.setUTCHours(hours, minutes, 0, 0);

          predictions.push({
            time: predTime,
            height: parseFloat(height),
            type: type === 'HW' ? 'H' : 'L',
          });
        }
      }

      const nowTime = now.getTime();
      const future = predictions.filter((p) => p.time.getTime() > nowTime);
      const nextHigh = future.find((p) => p.type === 'H');
      const nextLow = future.find((p) => p.type === 'L');

      const prev = predictions.filter((p) => p.time.getTime() <= nowTime).pop();
      let flow: 'ebb' | 'flood' | 'slack' = 'slack';
      if (prev) {
        const timeSince = nowTime - prev.time.getTime();
        if (timeSince < 30 * 60 * 1000) flow = 'slack';
        else if (prev.type === 'L') flow = 'flood';
        else flow = 'ebb';
      }

      return {
        height: 2.0,
        nextHigh: nextHigh
          ? nextHigh.time.toISOString()
          : new Date(nowTime + 6 * 3600000).toISOString(),
        nextLow: nextLow
          ? nextLow.time.toISOString()
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
      height: 2.0,
      nextHigh: new Date(now + 6 * 3600000).toISOString(),
      nextLow: new Date(now + 12 * 3600000).toISOString(),
      flow: 'flood',
    };
  }
}
