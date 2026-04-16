import { useState } from 'react';
import { useSailingStore } from '@/store';
import { useZones } from '@/hooks';
import { SkeletonCard } from '@/components/ui';
import type { SailingZone } from '@/types';
import styles from './ZonePanel.module.css';

function getSafetyColor(rating?: string): string {
  switch (rating) {
    case 'safe':
      return '#22c55e';
    case 'caution':
      return '#f59e0b';
    case 'danger':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
}

interface ZonePanelProps {
  onZoneSelect?: (zone: SailingZone) => void;
}

export default function ZonePanel({ onZoneSelect }: ZonePanelProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'safe' | 'caution' | 'danger' | 'favorites'>('all');

  const { data: zones, isLoading } = useZones();
  const { selectedZoneId, selectZone, favoriteZoneIds, toggleFavorite } = useSailingStore();

  const filtered = zones?.filter((zone) => {
    const matchesSearch = zone.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'favorites'
          ? favoriteZoneIds.includes(zone.id)
          : zone.conditions?.safetyRating === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={styles.panel}>
      <div className={styles.search}>
        <input
          type="search"
          placeholder="Search zones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
          aria-label="Search sailing zones"
        />
      </div>

      <div className={styles.filters} role="group" aria-label="Filter zones">
        {(['all', 'safe', 'caution', 'danger', 'favorites'] as const).map((f) => (
          <button
            key={f}
            className={[styles.filterBtn, filter === f ? styles.filterActive : ''].join(' ')}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
          >
            {f === 'favorites' ? '⭐' : f}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered?.length === 0 ? (
          <p className={styles.empty}>No zones match your search</p>
        ) : (
          filtered?.map((zone) => (
            <div
              key={zone.id}
              className={[
                styles.zoneItem,
                selectedZoneId === zone.id ? styles.zoneItemActive : '',
              ].join(' ')}
              onClick={() => {
                selectZone(zone.id);
                onZoneSelect?.(zone);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  selectZone(zone.id);
                  onZoneSelect?.(zone);
                }
              }}
              aria-selected={selectedZoneId === zone.id}
            >
              <div className={styles.zoneInfo}>
                <div className={styles.zoneHeader}>
                  <span className={styles.zoneName}>{zone.name}</span>
                  <span
                    className={styles.zoneDot}
                    style={{ backgroundColor: getSafetyColor(zone.conditions?.safetyRating) }}
                    aria-hidden="true"
                  />
                </div>
                {zone.conditions && (
                  <div className={styles.zoneStats}>
                    <span>{zone.conditions.wind.speed} kts</span>
                    <span>·</span>
                    <span>{zone.conditions.waves.height.toFixed(1)}m</span>
                    <span>·</span>
                    <span>Bf {zone.conditions.wind.beaufort}</span>
                  </div>
                )}
              </div>

              <button
                className={[
                  styles.favoriteBtn,
                  favoriteZoneIds.includes(zone.id) ? styles.favoriteBtnActive : '',
                ].join(' ')}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(zone.id);
                }}
                aria-label={
                  favoriteZoneIds.includes(zone.id)
                    ? `Remove ${zone.name} from favorites`
                    : `Add ${zone.name} to favorites`
                }
              >
                ⭐
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
