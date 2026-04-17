import { useState } from 'react';
import { useAlertStore } from '@/store';
import { useZones } from '@/hooks';
import { Button } from '@/components/ui';
import type { AlertType } from '@/store/alertStore';
import styles from './AlertConfigurator.module.css';

const ALERT_TYPES: { value: AlertType; label: string; unit: string; defaultThreshold: number }[] = [
  { value: 'wind', label: 'Wind speed', unit: 'knots', defaultThreshold: 25 },
  { value: 'wave', label: 'Wave height', unit: 'meters', defaultThreshold: 2 },
  { value: 'storm', label: 'Storm warning', unit: 'Beaufort', defaultThreshold: 8 },
  { value: 'fog', label: 'Visibility', unit: 'km', defaultThreshold: 1 },
  { value: 'custom', label: 'Custom', unit: 'value', defaultThreshold: 0 },
];

export default function AlertConfigurator() {
  const [selectedZone, setSelectedZone] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('wind');
  const [threshold, setThreshold] = useState(25);
  const [showForm, setShowForm] = useState(false);

  const { addConfig, configs, deleteConfig, toggleConfig } = useAlertStore();
  const { data: zones } = useZones();

  const selectedTypeConfig = ALERT_TYPES.find((t) => t.value === alertType);

  function handleTypeChange(type: AlertType) {
    setAlertType(type);
    const config = ALERT_TYPES.find((t) => t.value === type);
    if (config) setThreshold(config.defaultThreshold);
  }

  function handleAddConfig() {
    if (!selectedZone) return;
    const zone = zones?.find((z) => z.id === selectedZone);
    if (!zone) return;

    addConfig({
      zoneId: selectedZone,
      zoneName: zone.name,
      type: alertType,
      threshold,
      enabled: true,
    });

    setShowForm(false);
    setSelectedZone('');
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Alert configurations</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New alert'}
        </Button>
      </div>

      {showForm && (
        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Sailing zone</label>
            <select
              className={styles.select}
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
            >
              <option value="">Select a zone...</option>
              {zones?.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Alert type</label>
            <div className={styles.typeGrid}>
              {ALERT_TYPES.map((type) => (
                <button
                  key={type.value}
                  className={[
                    styles.typeBtn,
                    alertType === type.value ? styles.typeBtnActive : '',
                  ].join(' ')}
                  onClick={() => handleTypeChange(type.value)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Threshold ({selectedTypeConfig?.unit})</label>
            <div className={styles.thresholdRow}>
              <input
                type="range"
                min={0}
                max={
                  alertType === 'wind'
                    ? 60
                    : alertType === 'wave'
                      ? 8
                      : alertType === 'storm'
                        ? 12
                        : alertType === 'fog'
                          ? 20
                          : 100
                }
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.thresholdValue}>
                {threshold} {selectedTypeConfig?.unit}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={handleAddConfig}
            disabled={!selectedZone}
          >
            Save alert
          </Button>
        </div>
      )}

      {configs.length === 0 && !showForm && (
        <p className={styles.empty}>
          No alerts configured — add one to get notified about sailing conditions
        </p>
      )}

      <ul className={styles.configList}>
        {configs.map((config) => (
          <li key={config.id} className={styles.configItem}>
            <div className={styles.configInfo}>
              <div className={styles.configHeader}>
                <span className={styles.configZone}>{config.zoneName}</span>
                <span
                  className={[
                    styles.configBadge,
                    config.enabled ? styles.configBadgeActive : styles.configBadgeInactive,
                  ].join(' ')}
                >
                  {config.enabled ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className={styles.configMeta}>
                <span className={styles.configType}>
                  {ALERT_TYPES.find((t) => t.value === config.type)?.label}
                </span>
                <span className={styles.configSep}>·</span>
                <span className={styles.configThreshold}>
                  &gt; {config.threshold} {ALERT_TYPES.find((t) => t.value === config.type)?.unit}
                </span>
              </div>
            </div>
            <div className={styles.configActions}>
              <button
                className={styles.actionBtn}
                onClick={() => toggleConfig(config.id)}
                aria-label={config.enabled ? 'Pause alert' : 'Enable alert'}
                title={config.enabled ? 'Pause' : 'Enable'}
              >
                {config.enabled ? '⏸' : '▶'}
              </button>
              <button
                className={[styles.actionBtn, styles.actionBtnDanger].join(' ')}
                onClick={() => deleteConfig(config.id)}
                aria-label="Delete alert configuration"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
