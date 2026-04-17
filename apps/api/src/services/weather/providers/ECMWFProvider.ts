import axios from 'axios';
import type { WeatherProvider, ProviderConditions, ProviderForecastPoint } from './base.js';
import { msToKnots, knotsToBeaufort, calcSteepness } from './base.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

export class ECMWFProvider implements WeatherProvider {
  readonly name = 'ECMWF';
  readonly model = 'ecmwf';
  readonly priority = 9; // Highest priority globally

  supportsRegion(_lat: number, _lng: number): boolean {
    return true; // Global coverage
  }

  async getConditions(lat: number, lng: number): Promise<ProviderConditions> {
    const [forecastRes, marineRes] = await Promise.all([
      axios.get(FORECAST_URL, {
        params: {
          latitude: lat,
          longitude: lng,
          current: [
            'wind_speed_10m',
            'wind_direction_10m',
            'wind_gusts_10m',
            'temperature_2m',
            'precipitation',
            'cloud_cover',
            'surface_pressure',
            'relative_humidity_2m',
          ].join(','),
          models: 'ecmwf_ifs025',
          wind_speed_unit: 'ms',
        },
        timeout: 8000,
      }),
      axios.get(MARINE_URL, {
        params: {
          latitude: lat,
          longitude: lng,
          current: [
            'wave_height',
            'wave_direction',
            'wave_period',
            'swell_wave_height',
            'swell_wave_direction',
            'swell_wave_period',
            'wind_wave_height',
            'wind_wave_direction',
            'wind_wave_period',
          ].join(','),
          models: 'ecmwf_wam025',
        },
        timeout: 8000,
      }),
    ]);

    const f = forecastRes.data.current;
    const m = marineRes.data.current;
    const windKnots = msToKnots(f.wind_speed_10m ?? 0);
    const swellH = m.swell_wave_height ?? 0;
    const swellP = m.swell_wave_period ?? 0;
    const windWaveH = m.wind_wave_height ?? 0;
    const windWaveP = m.wind_wave_period ?? 0;

    return {
      model: this.model,
      timestamp: new Date().toISOString(),
      wind: {
        speed: windKnots,
        direction: f.wind_direction_10m ?? 0,
        gust: msToKnots(f.wind_gusts_10m ?? 0),
        beaufort: knotsToBeaufort(windKnots),
      },
      waves: {
        height: m.wave_height ?? 0,
        period: m.wave_period ?? 0,
        direction: m.wave_direction ?? 0,
        primarySwell: {
          height: swellH,
          period: swellP,
          direction: m.swell_wave_direction ?? 0,
          steepness: calcSteepness(swellH, swellP),
        },
        secondarySwell:
          windWaveH > 0.2
            ? {
                height: windWaveH,
                period: windWaveP,
                direction: m.wind_wave_direction ?? 0,
                steepness: calcSteepness(windWaveH, windWaveP),
              }
            : undefined,
      },
      weather: {
        temperature: f.temperature_2m ?? 0,
        visibility: 10,
        cloudCover: f.cloud_cover ?? 0,
        precipitation: f.precipitation ?? 0,
        pressure: f.surface_pressure ?? 1013,
        humidity: f.relative_humidity_2m ?? 0,
        description: 'ECMWF forecast',
      },
    };
  }

  async getForecast(lat: number, lng: number, hours: number): Promise<ProviderForecastPoint[]> {
    const days = Math.min(Math.ceil(hours / 24), 10);
    const [forecastRes, marineRes] = await Promise.all([
      axios.get(FORECAST_URL, {
        params: {
          latitude: lat,
          longitude: lng,
          hourly: [
            'wind_speed_10m',
            'wind_direction_10m',
            'wind_gusts_10m',
            'temperature_2m',
            'precipitation',
            'cloud_cover',
            'surface_pressure',
          ].join(','),
          models: 'ecmwf_ifs025',
          forecast_days: days,
          wind_speed_unit: 'ms',
        },
        timeout: 10000,
      }),
      axios.get(MARINE_URL, {
        params: {
          latitude: lat,
          longitude: lng,
          hourly: [
            'wave_height',
            'wave_direction',
            'wave_period',
            'swell_wave_height',
            'swell_wave_direction',
            'swell_wave_period',
            'wind_wave_height',
            'wind_wave_direction',
            'wind_wave_period',
          ].join(','),
          models: 'ecmwf_wam025',
          forecast_days: days,
        },
        timeout: 10000,
      }),
    ]);

    const fh = forecastRes.data.hourly;
    const mh = marineRes.data.hourly;

    return (fh.time as string[]).slice(0, hours).map((time, i) => {
      const windKnots = msToKnots(fh.wind_speed_10m?.[i] ?? 0);
      const swellH = mh.swell_wave_height?.[i] ?? 0;
      const swellP = mh.swell_wave_period?.[i] ?? 0;
      const windWaveH = mh.wind_wave_height?.[i] ?? 0;
      const windWaveP = mh.wind_wave_period?.[i] ?? 0;

      return {
        model: this.model,
        timestamp: time,
        forecastHour: i,
        wind: {
          speed: windKnots,
          direction: fh.wind_direction_10m?.[i] ?? 0,
          gust: msToKnots(fh.wind_gusts_10m?.[i] ?? 0),
          beaufort: knotsToBeaufort(windKnots),
        },
        waves: {
          height: mh.wave_height?.[i] ?? 0,
          period: mh.wave_period?.[i] ?? 0,
          direction: mh.wave_direction?.[i] ?? 0,
          primarySwell: {
            height: swellH,
            period: swellP,
            direction: mh.swell_wave_direction?.[i] ?? 0,
            steepness: calcSteepness(swellH, swellP),
          },
          secondarySwell:
            windWaveH > 0.2
              ? {
                  height: windWaveH,
                  period: windWaveP,
                  direction: mh.wind_wave_direction?.[i] ?? 0,
                  steepness: calcSteepness(windWaveH, windWaveP),
                }
              : undefined,
        },
        weather: {
          temperature: fh.temperature_2m?.[i] ?? 0,
          visibility: 10,
          cloudCover: fh.cloud_cover?.[i] ?? 0,
          precipitation: fh.precipitation?.[i] ?? 0,
          pressure: fh.surface_pressure?.[i] ?? 1013,
          humidity: 70,
          description: 'ECMWF forecast',
        },
      };
    });
  }
}
