import axios from 'axios';
import type { WeatherProvider, ProviderConditions, ProviderForecastPoint } from './base.js';
import { msToKnots, knotsToBeaufort, calcSteepness } from './base.js';

const BASE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export class OpenMeteoProvider implements WeatherProvider {
  readonly name = 'Open-Meteo';
  readonly model = 'open-meteo';
  readonly priority = 7;

  supportsRegion(_lat: number, _lng: number): boolean {
    return true; // Global coverage
  }

  async getConditions(lat: number, lng: number): Promise<ProviderConditions> {
    const [marineRes, forecastRes] = await Promise.all([
      axios.get(BASE_URL, {
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
            'swell_wave_peak_period',
            'wind_wave_height',
            'wind_wave_direction',
            'wind_wave_period',
          ].join(','),
        },
        timeout: 8000,
      }),
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
            'visibility',
            'weather_code',
          ].join(','),
          wind_speed_unit: 'ms',
        },
        timeout: 8000,
      }),
    ]);

    const marine = marineRes.data.current;
    const forecast = forecastRes.data.current;

    const windKnots = msToKnots(forecast.wind_speed_10m ?? 0);
    const gustKnots = msToKnots(forecast.wind_gusts_10m ?? 0);
    const swellHeight = marine.swell_wave_height ?? 0;
    const swellPeriod = marine.swell_wave_period ?? 0;
    const windWaveHeight = marine.wind_wave_height ?? 0;
    const windWavePeriod = marine.wind_wave_period ?? 0;

    return {
      model: this.model,
      timestamp: new Date().toISOString(),
      wind: {
        speed: windKnots,
        direction: forecast.wind_direction_10m ?? 0,
        gust: gustKnots,
        beaufort: knotsToBeaufort(windKnots),
      },
      waves: {
        height: marine.wave_height ?? 0,
        period: marine.wave_period ?? 0,
        direction: marine.wave_direction ?? 0,
        primarySwell: {
          height: swellHeight,
          period: swellPeriod,
          direction: marine.swell_wave_direction ?? 0,
          steepness: calcSteepness(swellHeight, swellPeriod),
        },
        secondarySwell:
          windWaveHeight > 0.2
            ? {
                height: windWaveHeight,
                period: windWavePeriod,
                direction: marine.wind_wave_direction ?? 0,
                steepness: calcSteepness(windWaveHeight, windWavePeriod),
              }
            : undefined,
      },
      weather: {
        temperature: forecast.temperature_2m ?? 0,
        visibility: (forecast.visibility ?? 10000) / 1000,
        cloudCover: forecast.cloud_cover ?? 0,
        precipitation: forecast.precipitation ?? 0,
        pressure: forecast.surface_pressure ?? 1013,
        humidity: forecast.relative_humidity_2m ?? 0,
        description: wmoCodeToDescription(forecast.weather_code ?? 0),
      },
    };
  }

  async getForecast(lat: number, lng: number, hours: number): Promise<ProviderForecastPoint[]> {
    const days = Math.min(Math.ceil(hours / 24), 16);

    const [marineRes, forecastRes] = await Promise.all([
      axios.get(BASE_URL, {
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
          forecast_days: days,
        },
        timeout: 10000,
      }),
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
            'relative_humidity_2m',
            'weather_code',
          ].join(','),
          forecast_days: days,
          wind_speed_unit: 'ms',
        },
        timeout: 10000,
      }),
    ]);

    const marineHourly = marineRes.data.hourly;
    const forecastHourly = forecastRes.data.hourly;
    const times = forecastHourly.time as string[];

    return times.slice(0, hours).map((time, i) => {
      const windKnots = msToKnots(forecastHourly.wind_speed_10m?.[i] ?? 0);
      const gustKnots = msToKnots(forecastHourly.wind_gusts_10m?.[i] ?? 0);
      const swellH = marineHourly.swell_wave_height?.[i] ?? 0;
      const swellP = marineHourly.swell_wave_period?.[i] ?? 0;
      const windWaveH = marineHourly.wind_wave_height?.[i] ?? 0;
      const windWaveP = marineHourly.wind_wave_period?.[i] ?? 0;

      return {
        model: this.model,
        timestamp: time,
        forecastHour: i,
        wind: {
          speed: windKnots,
          direction: forecastHourly.wind_direction_10m?.[i] ?? 0,
          gust: gustKnots,
          beaufort: knotsToBeaufort(windKnots),
        },
        waves: {
          height: marineHourly.wave_height?.[i] ?? 0,
          period: marineHourly.wave_period?.[i] ?? 0,
          direction: marineHourly.wave_direction?.[i] ?? 0,
          primarySwell: {
            height: swellH,
            period: swellP,
            direction: marineHourly.swell_wave_direction?.[i] ?? 0,
            steepness: calcSteepness(swellH, swellP),
          },
          secondarySwell:
            windWaveH > 0.2
              ? {
                  height: windWaveH,
                  period: windWaveP,
                  direction: marineHourly.wind_wave_direction?.[i] ?? 0,
                  steepness: calcSteepness(windWaveH, windWaveP),
                }
              : undefined,
        },
        weather: {
          temperature: forecastHourly.temperature_2m?.[i] ?? 0,
          visibility: 10,
          cloudCover: forecastHourly.cloud_cover?.[i] ?? 0,
          precipitation: forecastHourly.precipitation?.[i] ?? 0,
          pressure: forecastHourly.surface_pressure?.[i] ?? 1013,
          humidity: forecastHourly.relative_humidity_2m?.[i] ?? 0,
          description: wmoCodeToDescription(forecastHourly.weather_code?.[i] ?? 0),
        },
      };
    });
  }
}

function wmoCodeToDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 84) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}
