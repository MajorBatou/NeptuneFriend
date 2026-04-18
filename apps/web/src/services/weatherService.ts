import apiClient from './apiClient';
import type { SailingConditions, SailingZone, Forecast, ApiResponse } from '@/types';

// Transform API zone response to frontend SailingZone type
function transformZone(raw: Record<string, unknown>): SailingZone {
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string,
    coordinates: {
      lat: (raw.lat ?? (raw.coordinates as Record<string, number>)?.lat) as number,
      lng: (raw.lng ?? (raw.coordinates as Record<string, number>)?.lng) as number,
    },
    bounds: {
      north: (raw.boundsNorth ?? raw.bounds_north ?? 0) as number,
      south: (raw.boundsSouth ?? raw.bounds_south ?? 0) as number,
      east: (raw.boundsEast ?? raw.bounds_east ?? 0) as number,
      west: (raw.boundsWest ?? raw.bounds_west ?? 0) as number,
    },
    conditions: raw.conditions as SailingConditions | undefined,
    isFavorite: (raw.isFavorite ?? false) as boolean,
  };
}

export const weatherService = {
  getConditions: async (zoneId: string): Promise<SailingConditions> => {
    const { data } = await apiClient.get<ApiResponse<SailingConditions>>(
      `/weather/conditions/${zoneId}`
    );
    return data.data;
  },

  getAllZones: async (): Promise<SailingZone[]> => {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>[]>>('/weather/zones');
    return data.data.map(transformZone);
  },

  getForecast: async (zoneId: string, hours: 24 | 72 | 168 = 24): Promise<Forecast> => {
    const { data } = await apiClient.get<ApiResponse<Forecast>>(`/weather/forecast/${zoneId}`, {
      params: { hours },
    });
    return data.data;
  },

  getBulkConditions: async (zoneIds: string[]): Promise<SailingConditions[]> => {
    const { data } = await apiClient.post<ApiResponse<SailingConditions[]>>(
      '/weather/conditions/bulk',
      { zoneIds }
    );
    return data.data;
  },

  getNearestZone: async (lat: number, lng: number): Promise<SailingZone> => {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>('/weather/nearest', {
      params: { lat, lng },
    });
    return transformZone(data.data);
  },
};
