import axios from 'axios';
import type { WeatherProvider, ProviderConditions, ProviderForecastPoint } from './base.js';
import { msToKnots, knotsToBeaufort, calcSteepness } from './base.js';

const BASE_URL = 'https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point';

export class MetOfficeProvider implements WeatherProvider {
  readonly name = 'Met Office DataHub';
  readonly model = 'ukmo';
  readonly priority = 9; // Highest priority for UK/Ireland
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.METOFFICE_API_KEY ?? '';
  }

  supportsRegion(lat: number, lng: number): boolean {
    if (!this.apiKey) return false;
    // UK and Ireland bounding box
    return lat >= 49.5 && lat <= 61.5 && lng >= -12.0 && lng <= 3.0;
  }

  async getConditions(lat: number, lng: number): Promise<ProviderConditions> {
    const { data } = await axios.get(`${BASE_URL}/hourly`, {
      params: { latitude: lat, longitude: lng },
      headers: {
        apikey: this.apiKey,
        Accept: 'application/json',
      },
      timeout: 8000,
    });

    const features = data.features?.[0];
    const props = features?.properties;
    const current = props?.timeSeries?.[0];

    if (!current) throw new Error('No data from Met Office');

    const windKnots = msToKnots(current.windSpeed10m ?? 0);
    const gustKnots = msToKnots(current.windGustSpeed10m ?? 0);
    const waveHeight = current.significantWaveHeight ?? 0;
    const wavePeriod = current.wavePeriod ?? 0;

    return {
      model: this.model,
      timestamp: current.time ?? new Date().toISOString(),
      wind: {
        speed: windKnots,
        direction: current.windDirectionFrom10m ?? 0,
        gust: gustKnots,
        beaufort: knotsToBeaufort(windKnots),
      },
      waves: {
        height: waveHeight,
        period: wavePeriod,
        direction: current.waveDirection ?? 0,
        primarySwell: {
          height: waveHeight,
          period: wavePeriod,
          direction: current.waveDirection ?? 0,
          steepness: calcSteepness(waveHeight, wavePeriod),
        },
      },
      weather: {
        temperature: current.screenTemperature ?? 0,
        visibility: (current.visibility ?? 10000) / 1000,
        cloudCover: current.totalCloudAmount ?? 0,
        precipitation: current.precipitationRate ?? 0,
        pressure: current.mslp ? current.mslp / 100 : 1013,
        humidity: current.screenRelativeHumidity ?? 0,
        description: current.significantWeatherCode
          ? metOfficeWeatherCode(current.significantWeatherCode)
          : 'Unknown',
      },
    };
  }

  async getForecast(lat: number, lng: number, hours: number): Promise<ProviderForecastPoint[]> {
    const { data } = await axios.get(`${BASE_URL}/hourly`, {
      params: { latitude: lat, longitude: lng },
      headers: { apikey: this.apiKey, Accept: 'application/json' },
      timeout: 10000,
    });

    const timeSeries = data.features?.[0]?.properties?.timeSeries ?? [];

    return timeSeries.slice(0, hours).map((point: Record<string, unknown>, i: number) => {
      const windKnots = msToKnots((point.windSpeed10m as number) ?? 0);
      const gustKnots = msToKnots((point.windGustSpeed10m as number) ?? 0);
      const waveHeight = (point.significantWaveHeight as number) ?? 0;
      const wavePeriod = (point.wavePeriod as number) ?? 0;

      return {
        model: this.model,
        timestamp: (point.time as string) ?? new Date().toISOString(),
        forecastHour: i,
        wind: {
          speed: windKnots,
          direction: (point.windDirectionFrom10m as number) ?? 0,
          gust: gustKnots,
          beaufort: knotsToBeaufort(windKnots),
        },
        waves: {
          height: waveHeight,
          period: wavePeriod,
          direction: (point.waveDirection as number) ?? 0,
          primarySwell: {
            height: waveHeight,
            period: wavePeriod,
            direction: (point.waveDirection as number) ?? 0,
            steepness: calcSteepness(waveHeight, wavePeriod),
          },
        },
        weather: {
          temperature: (point.screenTemperature as number) ?? 0,
          visibility: ((point.visibility as number) ?? 10000) / 1000,
          cloudCover: (point.totalCloudAmount as number) ?? 0,
          precipitation: (point.precipitationRate as number) ?? 0,
          pressure: (point.mslp as number) ? (point.mslp as number) / 100 : 1013,
          humidity: (point.screenRelativeHumidity as number) ?? 0,
          description: metOfficeWeatherCode((point.significantWeatherCode as number) ?? 0),
        },
      };
    });
  }
}

function metOfficeWeatherCode(code: number): string {
  const codes: Record<number, string> = {
    0: 'Clear night',
    1: 'Sunny day',
    2: 'Partly cloudy night',
    3: 'Partly cloudy day',
    5: 'Mist',
    6: 'Fog',
    7: 'Cloudy',
    8: 'Overcast',
    9: 'Light rain shower',
    10: 'Light rain shower',
    11: 'Drizzle',
    12: 'Light rain',
    13: 'Heavy rain shower',
    14: 'Heavy rain shower',
    15: 'Heavy rain',
    16: 'Sleet shower',
    17: 'Sleet shower',
    18: 'Sleet',
    19: 'Hail shower',
    20: 'Hail shower',
    21: 'Hail',
    22: 'Light snow shower',
    23: 'Light snow shower',
    24: 'Light snow',
    25: 'Heavy snow shower',
    26: 'Heavy snow shower',
    27: 'Heavy snow',
    28: 'Thunder shower',
    29: 'Thunder shower',
    30: 'Thunder',
  };
  return codes[code] ?? 'Unknown';
}
