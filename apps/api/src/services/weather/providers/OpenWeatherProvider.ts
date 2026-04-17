import axios from 'axios';
import type { WeatherProvider, ProviderConditions, ProviderForecastPoint } from './base.js';
import { msToKnots, knotsToBeaufort, calcSteepness } from './base.js';

const BASE_URL = 'https://api.openweathermap.org/data/3.0';

export class OpenWeatherProvider implements WeatherProvider {
  readonly name = 'OpenWeatherMap';
  readonly model = 'openweather';
  readonly priority = 6;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY ?? '';
  }

  supportsRegion(_lat: number, _lng: number): boolean {
    return !!this.apiKey; // Global if key is set
  }

  async getConditions(lat: number, lng: number): Promise<ProviderConditions> {
    const { data } = await axios.get(`${BASE_URL}/onecall`, {
      params: {
        lat,
        lon: lng,
        exclude: 'minutely,daily,alerts',
        appid: this.apiKey,
        units: 'metric',
      },
      timeout: 8000,
    });

    const current = data.current;
    const windKnots = msToKnots(current.wind_speed ?? 0);
    const gustKnots = msToKnots(current.wind_gust ?? 0);

    // OpenWeather doesn't provide swell data — use wind wave estimate
    const estimatedWaveHeight = Math.min(windKnots * 0.05, 8);
    const estimatedPeriod = Math.max(3, windKnots * 0.3);

    return {
      model: this.model,
      timestamp: new Date(current.dt * 1000).toISOString(),
      wind: {
        speed: windKnots,
        direction: current.wind_deg ?? 0,
        gust: gustKnots,
        beaufort: knotsToBeaufort(windKnots),
      },
      waves: {
        height: estimatedWaveHeight,
        period: estimatedPeriod,
        direction: current.wind_deg ?? 0,
        primarySwell: {
          height: estimatedWaveHeight,
          period: estimatedPeriod,
          direction: current.wind_deg ?? 0,
          steepness: calcSteepness(estimatedWaveHeight, estimatedPeriod),
        },
      },
      weather: {
        temperature: current.temp ?? 0,
        visibility: (current.visibility ?? 10000) / 1000,
        cloudCover: current.clouds ?? 0,
        precipitation: current.rain?.['1h'] ?? 0,
        pressure: current.pressure ?? 1013,
        humidity: current.humidity ?? 0,
        description: current.weather?.[0]?.description ?? 'Unknown',
      },
    };
  }

  async getForecast(lat: number, lng: number, hours: number): Promise<ProviderForecastPoint[]> {
    const { data } = await axios.get(`${BASE_URL}/onecall`, {
      params: {
        lat,
        lon: lng,
        exclude: 'current,minutely,daily,alerts',
        appid: this.apiKey,
        units: 'metric',
      },
      timeout: 8000,
    });

    return (data.hourly as Record<string, unknown>[]).slice(0, hours).map((hour, i) => {
      const windKnots = msToKnots((hour.wind_speed as number) ?? 0);
      const gustKnots = msToKnots((hour.wind_gust as number) ?? 0);
      const estimatedWaveHeight = Math.min(windKnots * 0.05, 8);
      const estimatedPeriod = Math.max(3, windKnots * 0.3);

      return {
        model: this.model,
        timestamp: new Date((hour.dt as number) * 1000).toISOString(),
        forecastHour: i,
        wind: {
          speed: windKnots,
          direction: (hour.wind_deg as number) ?? 0,
          gust: gustKnots,
          beaufort: knotsToBeaufort(windKnots),
        },
        waves: {
          height: estimatedWaveHeight,
          period: estimatedPeriod,
          direction: (hour.wind_deg as number) ?? 0,
          primarySwell: {
            height: estimatedWaveHeight,
            period: estimatedPeriod,
            direction: (hour.wind_deg as number) ?? 0,
            steepness: calcSteepness(estimatedWaveHeight, estimatedPeriod),
          },
        },
        weather: {
          temperature: (hour.temp as number) ?? 0,
          visibility: ((hour.visibility as number) ?? 10000) / 1000,
          cloudCover: (hour.clouds as number) ?? 0,
          precipitation: (hour.rain as Record<string, number>)?.['1h'] ?? 0,
          pressure: (hour.pressure as number) ?? 1013,
          humidity: (hour.humidity as number) ?? 0,
          description:
            ((hour.weather as Record<string, unknown>[])?.[0]?.description as string) ?? 'Unknown',
        },
      };
    });
  }
}
