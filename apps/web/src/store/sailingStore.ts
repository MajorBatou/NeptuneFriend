import { create } from 'zustand';
import type { SailingZone, SailingConditions } from '@/types';

interface SailingState {
  zones: SailingZone[];
  selectedZoneId: string | null;
  favoriteZoneIds: string[];
  conditions: Record<string, SailingConditions>;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;

  setZones: (zones: SailingZone[]) => void;
  selectZone: (zoneId: string | null) => void;
  toggleFavorite: (zoneId: string) => void;
  setConditions: (zoneId: string, conditions: SailingConditions) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  getSelectedZone: () => SailingZone | undefined;
}

export const useSailingStore = create<SailingState>()((set, get) => ({
  zones: [],
  selectedZoneId: null,
  favoriteZoneIds: [],
  conditions: {},
  mapCenter: { lat: 51.5, lng: -0.1 }, // Default: London
  mapZoom: 7,

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
    })),

  setMapCenter: (mapCenter) => set({ mapCenter }),

  setMapZoom: (mapZoom) => set({ mapZoom }),

  getSelectedZone: () => {
    const { zones, selectedZoneId } = get();
    return zones.find((z) => z.id === selectedZoneId);
  },
}));
