import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SailingRoute, Waypoint } from '@/types';
import { calculateDistance } from '@/utils/sailing';

interface RouteState {
  routes: SailingRoute[];
  activeRouteId: string | null;
  draftWaypoints: Waypoint[];
  isDrawing: boolean;

  // Route actions
  createRoute: (name: string) => SailingRoute;
  saveRoute: (name: string) => SailingRoute | null;
  deleteRoute: (routeId: string) => void;
  selectRoute: (routeId: string | null) => void;
  getActiveRoute: () => SailingRoute | undefined;

  // Waypoint actions
  addWaypoint: (lat: number, lng: number, name?: string) => void;
  removeWaypoint: (waypointId: string) => void;
  clearDraft: () => void;
  setDrawing: (drawing: boolean) => void;

  // Calculations
  getDraftDistance: () => number;
  getDraftEstimatedTime: (avgSpeedKnots?: number) => number;
}

function generateWaypointId() {
  return `wp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateRouteId() {
  return `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function calcRouteDistance(waypoints: Waypoint[]): number {
  if (waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += calculateDistance(
      waypoints[i - 1].lat,
      waypoints[i - 1].lng,
      waypoints[i].lat,
      waypoints[i].lng
    );
  }
  return Math.round(total * 10) / 10;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set, get) => ({
      routes: [],
      activeRouteId: null,
      draftWaypoints: [],
      isDrawing: false,

      createRoute: (name) => {
        const route: SailingRoute = {
          id: generateRouteId(),
          name,
          waypoints: get().draftWaypoints,
          totalDistance: calcRouteDistance(get().draftWaypoints),
          estimatedTime: calcRouteDistance(get().draftWaypoints) / 6,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ routes: [...state.routes, route] }));
        return route;
      },

      saveRoute: (name) => {
        const { draftWaypoints } = get();
        if (draftWaypoints.length < 2) return null;

        const distance = calcRouteDistance(draftWaypoints);
        const route: SailingRoute = {
          id: generateRouteId(),
          name,
          waypoints: [...draftWaypoints],
          totalDistance: distance,
          estimatedTime: distance / 6, // assume 6 knots avg
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          routes: [...state.routes, route],
          draftWaypoints: [],
          isDrawing: false,
          activeRouteId: route.id,
        }));
        return route;
      },

      deleteRoute: (routeId) =>
        set((state) => ({
          routes: state.routes.filter((r) => r.id !== routeId),
          activeRouteId: state.activeRouteId === routeId ? null : state.activeRouteId,
        })),

      selectRoute: (routeId) => set({ activeRouteId: routeId }),

      getActiveRoute: () => {
        const { routes, activeRouteId } = get();
        return routes.find((r) => r.id === activeRouteId);
      },

      addWaypoint: (lat, lng, name) => {
        const waypoint: Waypoint = {
          id: generateWaypointId(),
          lat,
          lng,
          name,
        };
        set((state) => ({
          draftWaypoints: [...state.draftWaypoints, waypoint],
        }));
      },

      removeWaypoint: (waypointId) =>
        set((state) => ({
          draftWaypoints: state.draftWaypoints.filter((w) => w.id !== waypointId),
        })),

      clearDraft: () => set({ draftWaypoints: [], isDrawing: false }),

      setDrawing: (isDrawing) => set({ isDrawing }),

      getDraftDistance: () => calcRouteDistance(get().draftWaypoints),

      getDraftEstimatedTime: (avgSpeedKnots = 6) => {
        const distance = calcRouteDistance(get().draftWaypoints);
        return distance / avgSpeedKnots;
      },
    }),
    {
      name: 'neptune-routes',
      partialize: (state) => ({ routes: state.routes }),
    }
  )
);
