import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Alert } from '@/types';

export type AlertType = 'wind' | 'wave' | 'storm' | 'fog' | 'custom';

export interface AlertConfig {
  id: string;
  zoneId: string;
  zoneName: string;
  type: AlertType;
  threshold: number;
  enabled: boolean;
  createdAt: string;
}

interface AlertState {
  alerts: Alert[];
  configs: AlertConfig[];
  unreadCount: number;

  // Alert actions
  addAlert: (alert: Omit<Alert, 'id' | 'triggeredAt' | 'read'>) => void;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  deleteAlert: (alertId: string) => void;
  clearAllAlerts: () => void;

  // Config actions
  addConfig: (config: Omit<AlertConfig, 'id' | 'createdAt'>) => void;
  updateConfig: (configId: string, updates: Partial<AlertConfig>) => void;
  deleteConfig: (configId: string) => void;
  toggleConfig: (configId: string) => void;
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      configs: [],
      unreadCount: 0,

      addAlert: (alertData) => {
        const alert: Alert = {
          ...alertData,
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          triggeredAt: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          alerts: [alert, ...state.alerts].slice(0, 100), // keep last 100
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      markAllAsRead: () =>
        set((state) => ({
          alerts: state.alerts.map((a) => ({ ...a, read: true })),
          unreadCount: 0,
        })),

      deleteAlert: (alertId) => {
        const alert = get().alerts.find((a) => a.id === alertId);
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== alertId),
          unreadCount:
            alert && !alert.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        }));
      },

      clearAllAlerts: () => set({ alerts: [], unreadCount: 0 }),

      addConfig: (configData) => {
        const config: AlertConfig = {
          ...configData,
          id: `config-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ configs: [...state.configs, config] }));
      },

      updateConfig: (configId, updates) =>
        set((state) => ({
          configs: state.configs.map((c) => (c.id === configId ? { ...c, ...updates } : c)),
        })),

      deleteConfig: (configId) =>
        set((state) => ({
          configs: state.configs.filter((c) => c.id !== configId),
        })),

      toggleConfig: (configId) =>
        set((state) => ({
          configs: state.configs.map((c) =>
            c.id === configId ? { ...c, enabled: !c.enabled } : c
          ),
        })),
    }),
    {
      name: 'neptune-alerts',
      partialize: (state) => ({
        alerts: state.alerts,
        configs: state.configs,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
