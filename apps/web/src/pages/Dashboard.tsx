import { Spinner, SkeletonCard } from '@/components/ui';
import { ConditionsCard } from '@/components/sailing';
import { WindRose, TidalFlow, ForecastTimeline, WeatherStrip } from '@/components/weather';
import { SwellRose, SeaStateCard, ModelBadges } from '@/components/swell';
import { useZones, useConditions } from '@/hooks';
import { useSailingStore } from '@/store';
import { SafetyAlerts } from '@/components/safety';
import { useMarine } from '@/hooks/useMarine';
import { MarineConditionsCard } from '@/components/marine';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { selectedZoneId, selectZone } = useSailingStore();
  const { data: conditions, isLoading: conditionsLoading } = useConditions(selectedZoneId);
  const selectedZone = zones?.find((z) => z.id === selectedZoneId);
  const { data: marineData } = useMarine(selectedZoneId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sailing Dashboard</h1>
        <p className={styles.subtitle}>Real-time conditions — multi-model ensemble forecast</p>
      </header>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Sailing Zones</h2>
          {zonesLoading ? (
            <div className={styles.skeletons}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <ul className={styles.zoneList}>
              {zones?.map((zone) => (
                <li key={zone.id}>
                  <button
                    className={[
                      styles.zoneItem,
                      selectedZoneId === zone.id ? styles.zoneItemActive : '',
                    ].join(' ')}
                    onClick={() => selectZone(zone.id)}
                  >
                    <span className={styles.zoneName}>{zone.name}</span>
                    {zone.conditions && (
                      <span
                        className={styles.zoneDot}
                        style={{
                          backgroundColor:
                            zone.conditions.safetyRating === 'safe'
                              ? 'var(--color-wind-calm)'
                              : zone.conditions.safetyRating === 'caution'
                                ? 'var(--color-wind-moderate)'
                                : 'var(--color-wind-strong)',
                        }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className={styles.main}>
          {!selectedZoneId && (
            <div className={styles.empty}>
              <p>Select a sailing zone to view conditions</p>
            </div>
          )}

          {selectedZoneId && conditionsLoading && (
            <div className={styles.loading}>
              <Spinner size="lg" label="Loading conditions..." />
            </div>
          )}

          {selectedZoneId && conditions && selectedZone && (
            <div className={styles.detailGrid}>
              {/* Summary card */}
              <div className={styles.summaryCard}>
                <ConditionsCard conditions={conditions} zoneName={selectedZone.name} />
                {conditions.models && conditions.models.length > 0 && (
                  <div style={{ padding: '8px 16px 12px' }}>
                    <ModelBadges models={conditions.models} />
                  </div>
                )}
              </div>

              {/* Safety Alerts */}
              <div className={styles.fullCard}>
                <SafetyAlerts
                  wind={conditions.wind}
                  waves={conditions.waves}
                  weather={conditions.weather}
                />
              </div>
              {/* Wind Rose */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>Wind</h3>
                <WindRose wind={conditions.wind} size={180} />
              </div>

              {/* Swell Rose — primary + secondary */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>Swell</h3>
                <SwellRose waves={conditions.waves} size={180} />
              </div>

              {/* Sea State */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>Sea state</h3>
                <SeaStateCard waves={conditions.waves} modelCount={conditions.models?.length} />
              </div>

              {/* Tidal Flow */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>Tides</h3>
                <TidalFlow tides={conditions.tides} size="md" />
              </div>

              {/* Weather */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>Weather</h3>
                <WeatherStrip weather={conditions.weather} />
              </div>

              {/* Marine Conditions */}
              {marineData && (
                <div className={styles.fullCard}>
                  <MarineConditionsCard marine={marineData} />
                </div>
              )}

              {/* Forecast */}
              <div className={styles.forecastCard}>
                <h3 className={styles.cardTitle}>Forecast</h3>
                <ForecastTimeline zoneId={selectedZoneId} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
