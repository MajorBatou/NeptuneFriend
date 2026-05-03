import type {
  WeatherProvider,
  ProviderConditions,
  ProviderForecastPoint,
  ProviderWaveData,
} from './providers/base.js';
import { OpenMeteoProvider } from './providers/OpenMeteoProvider.js';
import { OpenWeatherProvider } from './providers/OpenWeatherProvider.js';
import { GFSProvider } from './providers/GFSProvider.js';
import { ICONProvider } from './providers/ICONProvider.js';
import { ECMWFProvider } from './providers/ECMWFProvider.js';
import { MetOfficeProvider } from './providers/MetOfficeProvider.js';
import { NOAAProvider } from './providers/NOAAProvider.js';
import { NTSLFProvider } from './providers/NTSLFProvider.js';
import { WorldTidesProvider } from './providers/WorldTidesProvider.js';

export interface AggregatedConditions {
  wind: {
    speed: number;
    direction: number;
    gust: number;
    beaufort: number;
  };
  waves: {
    height: number;
    period: number;
    direction: number;
    primarySwell: {
      height: number;
      period: number;
      direction: number;
      steepness: number;
    };
    secondarySwell?: {
      height: number;
      period: number;
      direction: number;
      steepness: number;
    };
    seaState: string;
    confusedSea: boolean;
    swellAngle?: number;
  };
  tides: {
    height: number;
    nextHigh: string;
    nextLow: string;
    flow: 'ebb' | 'flood' | 'slack';
  };
  weather: {
    temperature: number;
    visibility: number;
    cloudCover: number;
    precipitation: number;
    pressure: number;
    humidity: number;
    description: string;
  };
  safetyRating: 'safe' | 'caution' | 'danger';
  models: { model: string; weight: number }[];
  timestamp: string;
}

export class WeatherAggregator {
  private providers: WeatherProvider[];
  private noaaProvider: NOAAProvider;
  private ntslf: NTSLFProvider;
  private worldTides: WorldTidesProvider;

  constructor() {
    this.providers = [
      new ECMWFProvider(),
      new ICONProvider(),
      new GFSProvider(),
      new OpenMeteoProvider(),
      new OpenWeatherProvider(),
      new MetOfficeProvider(),
    ];
    this.noaaProvider = new NOAAProvider();
    this.ntslf = new NTSLFProvider();
    this.worldTides = new WorldTidesProvider();
  }

  async getConditions(lat: number, lng: number): Promise<AggregatedConditions> {
    const supportedProviders = this.providers.filter((p) => p.supportsRegion(lat, lng));

    const results = await Promise.allSettled(
      supportedProviders.map((p) => p.getConditions(lat, lng))
    );

    const successful = results
      .map((r, i) => ({
        data: r.status === 'fulfilled' ? r.value : null,
        provider: supportedProviders[i],
      }))
      .filter((r): r is { data: ProviderConditions; provider: WeatherProvider } => r.data !== null);

    if (successful.length === 0) throw new Error('All weather providers failed');

    // Get tides — try NOAA first (free), then NTSLF (free UK), then WorldTides (paid)
    const tides = await this.getTides(lat, lng);

    const totalWeight = successful.reduce((sum, r) => sum + r.provider.priority, 0);
    const blended = this.blendConditions(successful, totalWeight);
    const waves = this.processWaves(blended.waves);
    const safetyRating = this.calculateSafetyRating(
      blended.wind.beaufort,
      waves.height,
      waves.confusedSea
    );

    return {
      wind: blended.wind,
      waves,
      tides,
      weather: blended.weather,
      safetyRating,
      models: successful.map((r) => ({
        model: r.provider.model,
        weight: Math.round((r.provider.priority / totalWeight) * 100),
      })),
      timestamp: new Date().toISOString(),
    };
  }

  private async getTides(lat: number, lng: number) {
    // Try NOAA first (US zones, completely free)
    if (this.noaaProvider.supportsRegion(lat, lng)) {
      try {
        return await this.noaaProvider.getTides(lat, lng);
      } catch {
        // Fall through
      }
    }

    // Try NTSLF (UK/Ireland zones, completely free)
    if (this.ntslf.supportsRegion(lat, lng)) {
      try {
        return await this.ntslf.getTides(lat, lng);
      } catch {
        // Fall through
      }
    }

    // Fall back to WorldTides (paid, global)
    return await this.worldTides.getTides(lat, lng);
  }

  async getForecast(lat: number, lng: number, hours: number): Promise<ProviderForecastPoint[]> {
    const supportedProviders = this.providers.filter((p) => p.supportsRegion(lat, lng));

    const results = await Promise.allSettled(
      supportedProviders.map((p) => p.getForecast(lat, lng, hours))
    );

    const successful = results
      .map((r, i) => ({
        data: r.status === 'fulfilled' ? r.value : null,
        provider: supportedProviders[i],
      }))
      .filter(
        (r): r is { data: ProviderForecastPoint[]; provider: WeatherProvider } => r.data !== null
      );

    if (successful.length === 0) throw new Error('All forecast providers failed');

    const basePoints = successful.sort((a, b) => b.provider.priority - a.provider.priority)[0].data;
    const totalWeight = successful.reduce((sum, r) => sum + r.provider.priority, 0);

    return basePoints.map((_, i) => {
      const pointResults = successful.map((r) => ({
        data: r.data[i] ?? r.data[r.data.length - 1],
        provider: r.provider,
      }));
      return this.blendForecastPoint(pointResults, totalWeight, i);
    });
  }

  private blendConditions(
    results: { data: ProviderConditions; provider: WeatherProvider }[],
    totalWeight: number
  ) {
    let windSpeed = 0,
      windDir = 0,
      windGust = 0,
      windBeaufort = 0;
    let waveHeight = 0,
      wavePeriod = 0,
      waveDir = 0;
    let swellH = 0,
      swellP = 0,
      swellDir = 0,
      swellSteepness = 0;
    let secSwellH = 0,
      secSwellP = 0,
      secSwellDir = 0,
      secSwellSteepness = 0;
    let hasSecondary = false;
    let temp = 0,
      vis = 0,
      cloud = 0,
      precip = 0,
      pressure = 0,
      humidity = 0;
    let description = '';

    for (const { data, provider } of results) {
      const w = provider.priority / totalWeight;
      windSpeed += data.wind.speed * w;
      windDir += data.wind.direction * w;
      windGust += data.wind.gust * w;
      windBeaufort += data.wind.beaufort * w;
      waveHeight += data.waves.height * w;
      wavePeriod += data.waves.period * w;
      waveDir += data.waves.direction * w;
      swellH += data.waves.primarySwell.height * w;
      swellP += data.waves.primarySwell.period * w;
      swellDir += data.waves.primarySwell.direction * w;
      swellSteepness += data.waves.primarySwell.steepness * w;

      if (data.waves.secondarySwell) {
        hasSecondary = true;
        secSwellH += data.waves.secondarySwell.height * w;
        secSwellP += data.waves.secondarySwell.period * w;
        secSwellDir += data.waves.secondarySwell.direction * w;
        secSwellSteepness += data.waves.secondarySwell.steepness * w;
      }

      temp += data.weather.temperature * w;
      vis += data.weather.visibility * w;
      cloud += data.weather.cloudCover * w;
      precip += data.weather.precipitation * w;
      pressure += data.weather.pressure * w;
      humidity += data.weather.humidity * w;
      if (!description) description = data.weather.description;
    }

    const waves: ProviderWaveData = {
      height: Math.round(waveHeight * 10) / 10,
      period: Math.round(wavePeriod * 10) / 10,
      direction: Math.round(waveDir),
      primarySwell: {
        height: Math.round(swellH * 10) / 10,
        period: Math.round(swellP * 10) / 10,
        direction: Math.round(swellDir),
        steepness: Math.round(swellSteepness * 1000) / 1000,
      },
      secondarySwell: hasSecondary
        ? {
            height: Math.round(secSwellH * 10) / 10,
            period: Math.round(secSwellP * 10) / 10,
            direction: Math.round(secSwellDir),
            steepness: Math.round(secSwellSteepness * 1000) / 1000,
          }
        : undefined,
    };

    return {
      wind: {
        speed: Math.round(windSpeed),
        direction: Math.round(windDir),
        gust: Math.round(windGust),
        beaufort: Math.round(windBeaufort),
      },
      waves,
      weather: {
        temperature: Math.round(temp * 10) / 10,
        visibility: Math.round(vis * 10) / 10,
        cloudCover: Math.round(cloud),
        precipitation: Math.round(precip * 10) / 10,
        pressure: Math.round(pressure),
        humidity: Math.round(humidity),
        description,
      },
    };
  }

  private blendForecastPoint(
    results: { data: ProviderForecastPoint; provider: WeatherProvider }[],
    totalWeight: number,
    index: number
  ): ProviderForecastPoint {
    const blended = this.blendConditions(
      results.map((r) => ({ data: r.data, provider: r.provider })),
      totalWeight
    );
    return {
      ...blended,
      model: results.map((r) => r.provider.model).join('+'),
      timestamp: results[0].data.timestamp,
      forecastHour: index,
    };
  }

  private processWaves(waves: ProviderWaveData) {
    const primary = waves.primarySwell;
    const secondary = waves.secondarySwell;
    let swellAngle: number | undefined;
    let confusedSea = false;

    if (secondary && secondary.height > 0.3) {
      const angleDiff = Math.abs(primary.direction - secondary.direction);
      swellAngle = angleDiff > 180 ? 360 - angleDiff : angleDiff;
      confusedSea = swellAngle < 45;
    }

    return {
      height: waves.height,
      period: waves.period,
      direction: waves.direction,
      primarySwell: primary,
      secondarySwell: secondary,
      seaState: this.getSeaState(waves.height, confusedSea),
      confusedSea,
      swellAngle,
    };
  }

  private getSeaState(height: number, confused: boolean): string {
    if (confused) return 'confused';
    if (height < 0.1) return 'glassy';
    if (height < 0.5) return 'calm';
    if (height < 1.25) return 'smooth';
    if (height < 2.5) return 'slight';
    if (height < 4) return 'moderate';
    if (height < 6) return 'rough';
    if (height < 9) return 'very-rough';
    if (height < 14) return 'high';
    return 'phenomenal';
  }

  private calculateSafetyRating(
    beaufort: number,
    waveHeight: number,
    confusedSea: boolean
  ): 'safe' | 'caution' | 'danger' {
    // Confused sea only dangerous when combined with significant waves and wind
    const confusedSeaDanger = confusedSea && beaufort >= 7 && waveHeight >= 2.5;
    const confusedSeaCaution = confusedSea && beaufort >= 5 && waveHeight >= 1.5;

    if (beaufort >= 7 || waveHeight >= 3 || confusedSeaDanger) return 'danger';
    if (beaufort >= 5 || waveHeight >= 1.5 || confusedSeaCaution) return 'caution';
    return 'safe';
  }
}
