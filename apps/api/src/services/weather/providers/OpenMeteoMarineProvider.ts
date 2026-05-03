import axios from 'axios';

const MARINE_API = 'https://marine-api.open-meteo.com/v1/marine';

export interface MarineConditions {
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  windWaveHeight: number;
  windWaveDirection: number;
  windWavePeriod: number;
  swellWaveHeight: number;
  swellWaveDirection: number;
  swellWavePeriod: number;
  oceanCurrentVelocity: number | null;
  oceanCurrentDirection: number | null;
  seaSurfaceTemperature: number | null;
}

export class OpenMeteoMarineProvider {
  readonly name = 'Open-Meteo Marine';
  readonly model = 'open-meteo-marine';

  async getMarineConditions(lat: number, lng: number): Promise<MarineConditions> {
    const { data } = await axios.get(MARINE_API, {
      params: {
        latitude: lat,
        longitude: lng,
        hourly: [
          'wave_height',
          'wave_direction',
          'wave_period',
          'wind_wave_height',
          'wind_wave_direction',
          'wind_wave_period',
          'swell_wave_height',
          'swell_wave_direction',
          'swell_wave_period',
          'ocean_current_velocity',
          'ocean_current_direction',
          'sea_surface_temperature',
        ].join(','),
        forecast_days: 1,
        timezone: 'UTC',
      },
      timeout: 10000,
    });

    // Get current hour index
    const now = new Date();
    const currentHour = now.getUTCHours();
    const hourly = data.hourly;

    const get = (key: string): number | null => {
      const val = hourly[key]?.[currentHour];
      return val !== undefined && val !== null ? val : null;
    };

    return {
      waveHeight: get('wave_height') ?? 0,
      wavePeriod: get('wave_period') ?? 0,
      waveDirection: get('wave_direction') ?? 0,
      windWaveHeight: get('wind_wave_height') ?? 0,
      windWaveDirection: get('wind_wave_direction') ?? 0,
      windWavePeriod: get('wind_wave_period') ?? 0,
      swellWaveHeight: get('swell_wave_height') ?? 0,
      swellWaveDirection: get('swell_wave_direction') ?? 0,
      swellWavePeriod: get('swell_wave_period') ?? 0,
      oceanCurrentVelocity: get('ocean_current_velocity'),
      oceanCurrentDirection: get('ocean_current_direction'),
      seaSurfaceTemperature: get('sea_surface_temperature'),
    };
  }

  async getMarineForecast(
    lat: number,
    lng: number,
    hours: number = 24
  ): Promise<MarineConditions[]> {
    const { data } = await axios.get(MARINE_API, {
      params: {
        latitude: lat,
        longitude: lng,
        hourly: [
          'wave_height',
          'wave_direction',
          'wave_period',
          'wind_wave_height',
          'wind_wave_direction',
          'wind_wave_period',
          'swell_wave_height',
          'swell_wave_direction',
          'swell_wave_period',
        ].join(','),
        forecast_days: Math.ceil(hours / 24),
        timezone: 'UTC',
      },
      timeout: 10000,
    });

    const hourly = data.hourly;
    const currentHour = new Date().getUTCHours();

    return Array.from({ length: hours }, (_, i) => {
      const idx = currentHour + i;
      const get = (key: string): number => hourly[key]?.[idx] ?? 0;

      return {
        waveHeight: get('wave_height'),
        wavePeriod: get('wave_period'),
        waveDirection: get('wave_direction'),
        windWaveHeight: get('wind_wave_height'),
        windWaveDirection: get('wind_wave_direction'),
        windWavePeriod: get('wind_wave_period'),
        swellWaveHeight: get('swell_wave_height'),
        swellWaveDirection: get('swell_wave_direction'),
        swellWavePeriod: get('swell_wave_period'),
        oceanCurrentVelocity: null,
        oceanCurrentDirection: null,
        seaSurfaceTemperature: null,
      };
    });
  }
}
