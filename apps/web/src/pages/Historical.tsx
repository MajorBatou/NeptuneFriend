import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { ConditionsCard } from '@/components/sailing';
import { WindRose, TidalFlow, WeatherStrip } from '@/components/weather';
import { SwellRose, SeaStateCard } from '@/components/swell';
import { Spinner } from '@/components/ui';
import { SafetyAlerts } from '@/components/safety';
import styles from './Historical.module.css';

interface HistoricalEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  safetyRating: 'safe' | 'caution' | 'danger';
  windBeaufort: number;
  waveHeight: number;
  casualties?: string;
}

interface HistoricalEventFull extends HistoricalEvent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conditions: any;
  historicalNote: string;
}

export default function Historical() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['historical-events'],
    queryFn: async () => {
      const res = await apiClient.get('/historical');
      return res.data.data as HistoricalEvent[];
    },
  });

  const { data: selected, isLoading: isLoadingSelected } = useQuery({
    queryKey: ['historical-event', selectedId],
    queryFn: async () => {
      const res = await apiClient.get(`/historical/${selectedId}`);
      return res.data.data as HistoricalEventFull;
    },
    enabled: !!selectedId,
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>⚡ Historical Storm Conditions</h1>
        <p className={styles.subtitle}>Recreated conditions from famous sailing disasters</p>
      </div>

      <div className={styles.content}>
        {/* Sidebar — event list */}
        <aside className={styles.sidebar}>
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            events?.map((event) => (
              <button
                key={event.id}
                className={[
                  styles.eventCard,
                  selectedId === event.id ? styles.eventCardActive : '',
                ].join(' ')}
                onClick={() => setSelectedId(event.id === selectedId ? null : event.id)}
              >
                <div className={styles.eventName}>{event.name}</div>
                <div className={styles.eventDate}>
                  {new Date(event.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <div className={styles.eventStats}>
                  <span>💨 B{event.windBeaufort}</span>
                  <span>🌊 {event.waveHeight}m</span>
                </div>
                <span
                  className={
                    event.safetyRating === 'danger' ? styles.dangerBadge : styles.cautionBadge
                  }
                >
                  {event.safetyRating.toUpperCase()}
                </span>
              </button>
            ))
          )}
        </aside>

        {/* Main — conditions detail */}
        <main className={styles.main}>
          {!selectedId ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>⛵</span>
              <span className={styles.emptyText}>
                Select a storm event to see historical conditions
              </span>
            </div>
          ) : isLoadingSelected ? (
            <div className={styles.loading}>
              <Spinner size="md" />
            </div>
          ) : selected ? (
            <>
              <div className={styles.warningBanner}>
                ⚠️ Simulated conditions based on historical meteorological records — not live data
              </div>

              <SafetyAlerts
                wind={selected.conditions.wind}
                waves={selected.conditions.waves}
                weather={selected.conditions.weather}
              />

              <div className={styles.noteCard}>
                <h3 className={styles.noteTitle}>📚 {selected.name}</h3>
                <p className={styles.noteText}>{selected.historicalNote}</p>
                {selected.casualties && (
                  <p className={styles.casualties}>⚠️ {selected.casualties}</p>
                )}
              </div>

              {/* Summary card */}
              <div className={styles.detailGrid}>
                <div className={styles.summaryCard}>
                  <ConditionsCard conditions={selected.conditions} zoneName={selected.name} />
                </div>

                {/* Swell Rose */}
                <div className={styles.detailCard}>
                  <p className={styles.cardTitle}>Swell Analysis</p>
                  <SwellRose waves={selected.conditions.waves} size={180} />
                </div>

                {/* Sea State */}
                <div className={styles.detailCard}>
                  <p className={styles.cardTitle}>Sea State</p>
                  <SeaStateCard waves={selected.conditions.waves} />
                </div>

                {/* Wind Rose */}
                <div className={styles.detailCard}>
                  <p className={styles.cardTitle}>Wind</p>
                  <WindRose wind={selected.conditions.wind} size={180} />
                </div>

                {/* Tidal Flow */}
                <div className={styles.detailCard}>
                  <p className={styles.cardTitle}>Tidal Conditions</p>
                  <TidalFlow tides={selected.conditions.tides} size="md" />
                </div>

                {/* Weather Strip */}
                <div className={styles.fullCard}>
                  <p className={styles.cardTitle}>Weather Conditions</p>
                  <WeatherStrip weather={selected.conditions.weather} />
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
