import apiClient from './apiClient';
import type { SailingConditions, SailingZone, Forecast, ApiResponse } from '@/types';

export const weatherService = {
  // Get conditions for a specific zone
  getConditions: async (zoneId: string): Promise<SailingConditions> => {
    const { data } = await apiClient.get<ApiResponse<SailingConditions>>(
      `/weather/conditions/${zoneId}`
    );
    return data.data;
  },

  // Get all sailing zones with current conditions
  getAllZones: async (): Promise<SailingZone[]> => {
    const { data } = await apiClient.get<ApiResponse<SailingZone[]>>('/weather/zones');
    return data.data;
  },

  // Get forecast for a zone (24h, 72h, or 7 days)
  getForecast: async (zoneId: string, hours: 24 | 72 | 168 = 24): Promise<Forecast> => {
    const { data } = await apiClient.get<ApiResponse<Forecast>>(`/weather/forecast/${zoneId}`, {
      params: { hours },
    });
    return data.data;
  },

  // Get conditions for multiple zones (used by map view)
  getBulkConditions: async (zoneIds: string[]): Promise<SailingConditions[]> => {
    const { data } = await apiClient.post<ApiResponse<SailingConditions[]>>(
      '/weather/conditions/bulk',
      { zoneIds }
    );
    return data.data;
  },

  // Get nearest zone to coordinates
  getNearestZone: async (lat: number, lng: number): Promise<SailingZone> => {
    const { data } = await apiClient.get<ApiResponse<SailingZone>>('/weather/zones/nearest', {
      params: { lat, lng },
    });
    return data.data;
  },
};
