import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useSailingStore } from '@/store';
import { useZones } from '@/hooks';
import ZoneMarker from './ZoneMarker';
import WindOverlay from './WindOverlay';
import MapControls from './MapControls';
import 'leaflet/dist/leaflet.css';
import styles from './SailingMap.module.css';

// Fix Leaflet default icon issue with Vite
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// Sync Zustand map state with Leaflet
function MapStateSync() {
  const { mapCenter, mapZoom, setMapCenter, setMapZoom } = useSailingStore();
  const map = useMap();
  const isSyncing = useRef(false);

  useEffect(() => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    map.setView([mapCenter.lat, mapCenter.lng], mapZoom);
    isSyncing.current = false;
  }, [map, mapCenter, mapZoom]);

  useEffect(() => {
    const onMoveEnd = () => {
      const center = map.getCenter();
      setMapCenter({ lat: center.lat, lng: center.lng });
      setMapZoom(map.getZoom());
    };
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
    };
  }, [map, setMapCenter, setMapZoom]);

  return null;
}

interface SailingMapProps {
  showWindOverlay?: boolean;
  height?: string;
}

export default function SailingMap({ showWindOverlay = true, height = '100%' }: SailingMapProps) {
  const { mapCenter, mapZoom } = useSailingStore();
  const { data: zones, isLoading } = useZones();

  return (
    <div className={styles.wrapper} style={{ height }}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <span className={styles.loadingText}>Loading zones...</span>
        </div>
      )}

      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        className={styles.map}
        zoomControl={false}
      >
        {/* OpenStreetMap nautical tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={18}
        />

        <MapStateSync />
        <MapControls />

        {/* Zone markers */}
        {zones?.map((zone) => (
          <ZoneMarker key={zone.id} zone={zone} />
        ))}

        {/* Wind overlay */}
        {showWindOverlay && <WindOverlay />}
      </MapContainer>
    </div>
  );
}
