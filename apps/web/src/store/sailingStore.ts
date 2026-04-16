import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type { SailingZone, SailingConditions } from '@/types';

interface SailingState {
  zones: SailingZone[];
  selectedZoneId: string | null;
  favoriteZoneIds: string[];
  conditions: Record<string, SailingConditions>;
  conditionsLastFetched: Record<string, number>;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  isOffline: boolean;

  setZones: (zones: SailingZone[]) => void;
  selectZone: (zoneId: string | null) => void;
  toggleFavorite: (zoneId: string) => void;
  setConditions: (zoneId: string, conditions: SailingConditions) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  setOffline: (offline: boolean) => void;
  getSelectedZone: () => SailingZone | undefined;
  isConditionsStale: (zoneId: string, maxAgeMs?: number) => boolean;
  clearConditionsCache: () => void;
}

export const useSailingStore = create<SailingState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        zones: [],
        selectedZoneId: null,
        favoriteZoneIds: [],
        conditions: {},
        conditionsLastFetched: {},
        mapCenter: { lat: 51.5, lng: -0.1 },
        mapZoom: 7,
        isOffline: false,

        setZones: (zones) => set({ zones }),
        selectZone: (zoneId) => set({ selectedZoneId: zoneId }),

        toggleFavorite: (zoneId) =>
          set((state) => ({
            favoriteZoneIds: state.favoriteZoneIds.includes(zoneId)
              ? state.favoriteZoneIds.filter((id) => id !== zoneId)
              : [...state.favoriteZoneIds, zoneId],
          })),

        setConditions: (zoneId, conditions) =>
          set((state) => ({
            conditions: { ...state.conditions, [zoneId]: conditions },
            conditionsLastFetched: {
              ...state.conditionsLastFetched,
              [zoneId]: Date.now(),
            },
          })),

        setMapCenter: (mapCenter) => set({ mapCenter }),
        setMapZoom: (mapZoom) => set({ mapZoom }),
        setOffline: (isOffline) => set({ isOffline }),

        getSelectedZone: () => {
          const { zones, selectedZoneId } = get();
          return zones.find((z) => z.id === selectedZoneId);
        },

        isConditionsStale: (zoneId, maxAgeMs = 5 * 60 * 1000) => {
          const lastFetched = get().conditionsLastFetched[zoneId];
          if (!lastFetched) return true;
          return Date.now() - lastFetched > maxAgeMs;
        },

        clearConditionsCache: () => set({ conditions: {}, conditionsLastFetched: {} }),
      }),
      {
        name: 'neptune-sailing',
        partialize: (state) => ({
          favoriteZoneIds: state.favoriteZoneIds,
          mapCenter: state.mapCenter,
          mapZoom: state.mapZoom,
        }),
      }
    )
  )
);
