import { describe, it, expect, beforeEach } from 'vitest';
import { useRouteStore } from '../store/routeStore';

beforeEach(() => {
  useRouteStore.setState({
    routes: [],
    activeRouteId: null,
    draftWaypoints: [],
    isDrawing: false,
  });
});

describe('RouteStore', () => {
  it('starts drawing mode', () => {
    useRouteStore.getState().setDrawing(true);
    expect(useRouteStore.getState().isDrawing).toBe(true);
  });

  it('adds waypoints', () => {
    useRouteStore.getState().addWaypoint(51.5, -0.1, 'London');
    useRouteStore.getState().addWaypoint(51.6, -0.2, 'Point B');
    expect(useRouteStore.getState().draftWaypoints).toHaveLength(2);
  });

  it('removes a waypoint', () => {
    useRouteStore.getState().addWaypoint(51.5, -0.1);
    useRouteStore.getState().addWaypoint(51.6, -0.2);
    const id = useRouteStore.getState().draftWaypoints[0].id;
    useRouteStore.getState().removeWaypoint(id);
    expect(useRouteStore.getState().draftWaypoints).toHaveLength(1);
  });

  it('saves a route with at least 2 waypoints', () => {
    useRouteStore.getState().addWaypoint(51.5, -0.1);
    useRouteStore.getState().addWaypoint(51.6, -0.2);
    const route = useRouteStore.getState().saveRoute('Test Route');
    expect(route).not.toBeNull();
    expect(useRouteStore.getState().routes).toHaveLength(1);
    expect(useRouteStore.getState().routes[0].name).toBe('Test Route');
  });

  it('returns null when saving with less than 2 waypoints', () => {
    useRouteStore.getState().addWaypoint(51.5, -0.1);
    const route = useRouteStore.getState().saveRoute('Single Point');
    expect(route).toBeNull();
  });

  it('clears draft after saving', () => {
    useRouteStore.getState().addWaypoint(51.5, -0.1);
    useRouteStore.getState().addWaypoint(51.6, -0.2);
    useRouteStore.getState().saveRoute('Test');
    expect(useRouteStore.getState().draftWaypoints).toHaveLength(0);
    expect(useRouteStore.getState().isDrawing).toBe(false);
  });

  it('deletes a route', () => {
    useRouteStore.getState().addWaypoint(51.5, -0.1);
    useRouteStore.getState().addWaypoint(51.6, -0.2);
    useRouteStore.getState().saveRoute('Test');
    const id = useRouteStore.getState().routes[0].id;
    useRouteStore.getState().deleteRoute(id);
    expect(useRouteStore.getState().routes).toHaveLength(0);
  });

  it('calculates draft distance', () => {
    useRouteStore.getState().addWaypoint(51.5, -0.1);
    useRouteStore.getState().addWaypoint(52.5, -0.1);
    const distance = useRouteStore.getState().getDraftDistance();
    expect(distance).toBeGreaterThan(0);
  });

  it('clears draft', () => {
    useRouteStore.getState().addWaypoint(51.5, -0.1);
    useRouteStore.getState().setDrawing(true);
    useRouteStore.getState().clearDraft();
    expect(useRouteStore.getState().draftWaypoints).toHaveLength(0);
    expect(useRouteStore.getState().isDrawing).toBe(false);
  });
});
