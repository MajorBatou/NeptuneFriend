import axios from 'axios';

const BASE_URL = 'https://www.worldtides.info/api/v3';

export interface TidalResult {
  height: number;
  nextHigh: string;
  nextLow: string;
  flow: 'ebb' | 'flood' | 'slack';
}

export class WorldTidesProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.WORLDTIDES_API_KEY ?? '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getTides(lat: number, lng: number): Promise<TidalResult> {
    if (!this.apiKey) {
      return this.getFallbackTides();
    }

    try {
      const { data } = await axios.get(BASE_URL, {
        params: {
          heights: '',
          extremes: '',
          lat,
          lon: lng,
          key: this.apiKey,
          datum: 'LAT',
        },
        timeout: 8000,
      });

      const now = Date.now() / 1000;
      const currentHeight = data.heights?.[0]?.height ?? 0;
      const extremes = (data.extremes ?? []) as { type: string; date: number; height: number }[];

      const nextHigh = extremes.find((e) => e.type === 'High' && e.date > now);
      const nextLow = extremes.find((e) => e.type === 'Low' && e.date > now);

      // Determine flow direction
      const prevExtreme = extremes.filter((e) => e.date <= now).pop();
      let flow: 'ebb' | 'flood' | 'slack' = 'slack';

      if (prevExtreme) {
        const timeSince = now - prevExtreme.date;
        if (timeSince < 1800) {
          flow = 'slack';
        } else if (prevExtreme.type === 'Low') {
          flow = 'flood';
        } else {
          flow = 'ebb';
        }
      }

      return {
        height: Math.round(currentHeight * 10) / 10,
        nextHigh: nextHigh
          ? new Date(nextHigh.date * 1000).toISOString()
          : new Date(Date.now() + 6 * 3600000).toISOString(),
        nextLow: nextLow
          ? new Date(nextLow.date * 1000).toISOString()
          : new Date(Date.now() + 3 * 3600000).toISOString(),
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
