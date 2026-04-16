import { useCallback } from 'react';
import { SailingMap, ZonePanel } from '@/components/map';
import { ConditionsCard } from '@/components/sailing';
import { Spinner } from '@/components/ui';
import { useConditions } from '@/hooks';
import { useSailingStore } from '@/store';
import type { SailingZone } from '@/types';
import styles from './Map.module.css';

export default function MapPage() {
  const { selectedZoneId, setMapCenter, setMapZoom } = useSailingStore();
  const { data: conditions, isLoading } = useConditions(selectedZoneId);
  const { zones } = useSailingStore();
  const selectedZone = zones?.find?.((z) => z.id === selectedZoneId);

  const handleZoneSelect = useCallback(
    (zone: SailingZone) => {
      setMapCenter({ lat: zone.coordinates.lat, lng: zone.coordinates.lng });
      setMapZoom(11);
    },
    [setMapCenter, setMapZoom]
  );

  return (
    <div className={styles.page}>
      {/* Left panel — zone list */}
      <aside className={styles.sidebar}>
        <ZonePanel onZoneSelect={handleZoneSelect} />
      </aside>

      {/* Map */}
      <div className={styles.mapArea}>
        <SailingMap height="100%" showWindOverlay />
      </div>

      {/* Right panel — conditions detail */}
      {selectedZoneId && (
        <aside className={styles.detail}>
          {isLoading ? (
            <div className={styles.detailLoading}>
              <Spinner size="md" />
            </div>
          ) : conditions && selectedZone ? (
            <ConditionsCard conditions={conditions} zoneName={selectedZone.name} />
          ) : null}
        </aside>
      )}
    </div>
  );
}
