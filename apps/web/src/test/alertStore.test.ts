import { describe, it, expect, beforeEach } from 'vitest';
import { useAlertStore } from '../store/alertStore';

beforeEach(() => {
  useAlertStore.setState({ alerts: [], configs: [], unreadCount: 0 });
});

describe('AlertStore', () => {
  it('adds an alert', () => {
    useAlertStore.getState().addAlert({
      userId: 'u1',
      zoneId: 'z1',
      zoneName: 'Test Zone',
      type: 'wind',
      severity: 'warning',
      threshold: 25,
      message: 'Wind exceeds 25 knots',
    });
    expect(useAlertStore.getState().alerts).toHaveLength(1);
    expect(useAlertStore.getState().unreadCount).toBe(1);
  });

  it('marks alert as read', () => {
    useAlertStore.getState().addAlert({
      userId: 'u1',
      zoneId: 'z1',
      zoneName: 'Test Zone',
      type: 'wind',
      severity: 'warning',
      threshold: 25,
      message: 'Wind exceeds 25 knots',
    });
    const id = useAlertStore.getState().alerts[0].id;
    useAlertStore.getState().markAsRead(id);
    expect(useAlertStore.getState().alerts[0].read).toBe(true);
    expect(useAlertStore.getState().unreadCount).toBe(0);
  });

  it('marks all alerts as read', () => {
    useAlertStore
      .getState()
      .addAlert({
        userId: 'u1',
        zoneId: 'z1',
        zoneName: 'Zone',
        type: 'wind',
        severity: 'warning',
        threshold: 25,
        message: 'Msg 1',
      });
    useAlertStore
      .getState()
      .addAlert({
        userId: 'u1',
        zoneId: 'z1',
        zoneName: 'Zone',
        type: 'wave',
        severity: 'critical',
        threshold: 3,
        message: 'Msg 2',
      });
    useAlertStore.getState().markAllAsRead();
    expect(useAlertStore.getState().unreadCount).toBe(0);
    expect(useAlertStore.getState().alerts.every((a) => a.read)).toBe(true);
  });

  it('deletes an alert', () => {
    useAlertStore
      .getState()
      .addAlert({
        userId: 'u1',
        zoneId: 'z1',
        zoneName: 'Zone',
        type: 'wind',
        severity: 'info',
        threshold: 15,
        message: 'Test',
      });
    const id = useAlertStore.getState().alerts[0].id;
    useAlertStore.getState().deleteAlert(id);
    expect(useAlertStore.getState().alerts).toHaveLength(0);
  });

  it('adds an alert config', () => {
    useAlertStore
      .getState()
      .addConfig({ zoneId: 'z1', zoneName: 'Zone', type: 'wind', threshold: 25, enabled: true });
    expect(useAlertStore.getState().configs).toHaveLength(1);
  });

  it('toggles config enabled state', () => {
    useAlertStore
      .getState()
      .addConfig({ zoneId: 'z1', zoneName: 'Zone', type: 'wind', threshold: 25, enabled: true });
    const id = useAlertStore.getState().configs[0].id;
    useAlertStore.getState().toggleConfig(id);
    expect(useAlertStore.getState().configs[0].enabled).toBe(false);
  });

  it('clears all alerts', () => {
    useAlertStore
      .getState()
      .addAlert({
        userId: 'u1',
        zoneId: 'z1',
        zoneName: 'Zone',
        type: 'wind',
        severity: 'warning',
        threshold: 25,
        message: 'Test',
      });
    useAlertStore.getState().clearAllAlerts();
    expect(useAlertStore.getState().alerts).toHaveLength(0);
    expect(useAlertStore.getState().unreadCount).toBe(0);
  });
});
