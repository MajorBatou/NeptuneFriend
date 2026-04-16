import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { weatherService } from '@/services';
import { useToastStore, useSailingStore } from '@/store';
import type { SailingConditions, SailingZone, Forecast } from '@/types';

export const weatherKeys = {
  all: ['weather'] as const,
  zones: () => [...weatherKeys.all, 'zones'] as const,
  conditions: (zoneId: string) => [...weatherKeys.all, 'conditions', zoneId] as const,
  forecast: (zoneId: string, hours: number) =>
    [...weatherKeys.all, 'forecast', zoneId, hours] as const,
};

export function useZones() {
  const toast = useToastStore();
  const { setZones } = useSailingStore();

  return useQuery<SailingZone[]>({
    queryKey: weatherKeys.zones(),
    queryFn: async () => {
      const zones = await weatherService.getAllZones();
      setZones(zones);
      return zones;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
    meta: {
      onError: () => {
        toast.error('Failed to load sailing zones — check your connection');
      },
    },
  });
}

export function useConditions(zoneId: string | null) {
  const toast = useToastStore();
  const { setConditions } = useSailingStore();

  return useQuery<SailingConditions>({
    queryKey: weatherKeys.conditions(zoneId ?? ''),
    queryFn: async () => {
      const conditions = await weatherService.getConditions(zoneId!);
      setConditions(zoneId!, conditions);
      return conditions;
    },
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    meta: {
      onError: () => {
        toast.error('Failed to load conditions — showing cached data if available');
      },
    },
  });
}

export function useForecast(zoneId: string | null, hours: 24 | 72 | 168 = 24) {
  const toast = useToastStore();

  return useQuery<Forecast>({
    queryKey: weatherKeys.forecast(zoneId ?? '', hours),
    queryFn: () => weatherService.getForecast(zoneId!, hours),
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 30,
    meta: {
      onError: () => {
        toast.error('Failed to load forecast');
      },
    },
  });
}

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

export function useRefreshConditions() {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  return useMutation({
    mutationFn: (zoneId: string) => weatherService.getConditions(zoneId),
    onSuccess: (data, zoneId) => {
      queryClient.setQueryData(weatherKeys.conditions(zoneId), data);
      toast.success('Conditions refreshed');
    },
    onError: () => {
      toast.error('Failed to refresh conditions');
    },
  });
}
