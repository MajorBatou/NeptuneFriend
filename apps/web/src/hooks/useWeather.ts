import { useQuery, useQueryClient } from '@tanstack/react-query';
import { weatherService } from '@/services';
import type { SailingConditions, SailingZone, Forecast } from '@/types';

// Query keys factory
export const weatherKeys = {
  all: ['weather'] as const,
  zones: () => [...weatherKeys.all, 'zones'] as const,
  conditions: (zoneId: string) => [...weatherKeys.all, 'conditions', zoneId] as const,
  forecast: (zoneId: string, hours: number) =>
    [...weatherKeys.all, 'forecast', zoneId, hours] as const,
};

// All sailing zones
export function useZones() {
  return useQuery<SailingZone[]>({
    queryKey: weatherKeys.zones(),
    queryFn: weatherService.getAllZones,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });
}

// Conditions for a specific zone
export function useConditions(zoneId: string | null) {
  return useQuery<SailingConditions>({
    queryKey: weatherKeys.conditions(zoneId ?? ''),
    queryFn: () => weatherService.getConditions(zoneId!),
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5, // Refresh conditions every 5 minutes
  });
}

// Forecast for a zone
export function useForecast(zoneId: string | null, hours: 24 | 72 | 168 = 24) {
  return useQuery<Forecast>({
    queryKey: weatherKeys.forecast(zoneId ?? '', hours),
    queryFn: () => weatherService.getForecast(zoneId!, hours),
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 30, // Forecasts stale after 30 minutes
  });
}

// Prefetch a zone's conditions (used on map hover)
export function usePrefetchConditions() {
  const queryClient = useQueryClient();

  return (zoneId: string) => {
    queryClient.prefetchQuery({
      queryKey: weatherKeys.conditions(zoneId),
      queryFn: () => weatherService.getConditions(zoneId),
      staleTime: 1000 * 60 * 5,
    });
  };
}
