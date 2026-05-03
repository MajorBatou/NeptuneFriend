import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface MarineData {
  windWave: {
    height: number;
    direction: number;
    period: number;
  };
  oceanCurrent: {
    velocity: number | null;
    direction: number | null;
    description: string | null;
  };
  seaSurfaceTemperature: number | null;
}

export function useMarine(zoneId: string | null) {
  return useQuery({
    queryKey: ['marine', zoneId],
    queryFn: async () => {
      const res = await apiClient.get(`/marine/${zoneId}`);
      return res.data.data as MarineData;
    },
    enabled: !!zoneId,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
