import { describe, it, expect, beforeEach } from 'vitest';
import { useSailingStore } from '../store/sailingStore';
import { useToastStore } from '../store/toastStore';

// Reset store state between tests
beforeEach(() => {
  useSailingStore.setState({
    zones: [],
    selectedZoneId: null,
    favoriteZoneIds: [],
    conditions: {},
    conditionsLastFetched: {},
  });
  useToastStore.setState({ toasts: [] });
});

describe('SailingStore', () => {
  it('selects a zone', () => {
    useSailingStore.getState().selectZone('zone-1');
    expect(useSailingStore.getState().selectedZoneId).toBe('zone-1');
  });

  it('deselects a zone when null is passed', () => {
    useSailingStore.getState().selectZone('zone-1');
    useSailingStore.getState().selectZone(null);
    expect(useSailingStore.getState().selectedZoneId).toBeNull();
  });

  it('adds a favorite', () => {
    useSailingStore.getState().toggleFavorite('zone-1');
    expect(useSailingStore.getState().favoriteZoneIds).toContain('zone-1');
  });

  it('removes a favorite when toggled again', () => {
    useSailingStore.getState().toggleFavorite('zone-1');
    useSailingStore.getState().toggleFavorite('zone-1');
    expect(useSailingStore.getState().favoriteZoneIds).not.toContain('zone-1');
  });

  it('marks conditions as stale when never fetched', () => {
    expect(useSailingStore.getState().isConditionsStale('zone-1')).toBe(true);
  });

  it('marks conditions as fresh immediately after setting', () => {
    const mockConditions = { id: 'c1' } as never;
    useSailingStore.getState().setConditions('zone-1', mockConditions);
    expect(useSailingStore.getState().isConditionsStale('zone-1')).toBe(false);
  });

  it('updates map center', () => {
    useSailingStore.getState().setMapCenter({ lat: 53.0, lng: -1.5 });
    expect(useSailingStore.getState().mapCenter).toEqual({ lat: 53.0, lng: -1.5 });
  });

  it('sets offline state', () => {
    useSailingStore.getState().setOffline(true);
    expect(useSailingStore.getState().isOffline).toBe(true);
  });
});

describe('ToastStore', () => {
  it('adds a success toast', () => {
    useToastStore.getState().success('Conditions refreshed');
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Conditions refreshed');
  });

  it('adds an error toast', () => {
    useToastStore.getState().error('Connection failed');
    expect(useToastStore.getState().toasts[0].type).toBe('error');
  });

  it('removes a toast by id', () => {
    useToastStore.getState().success('Test');
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('supports multiple toasts', () => {
    useToastStore.getState().success('First');
    useToastStore.getState().error('Second');
    useToastStore.getState().warning('Third');
    expect(useToastStore.getState().toasts).toHaveLength(3);
  });
});
