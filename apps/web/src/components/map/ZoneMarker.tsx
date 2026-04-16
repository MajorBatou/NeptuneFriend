import { useCallback } from 'react';
import { Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSailingStore } from '@/store';
import { usePrefetchConditions } from '@/hooks';
import type { SailingZone } from '@/types';
import styles from './ZoneMarker.module.css';

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

function createZoneIcon(color: string, isFavorite: boolean) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.15s;
      ">
        ${isFavorite ? '⭐' : '⚓'}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

interface ZoneMarkerProps {
  zone: SailingZone;
}

export default function ZoneMarker({ zone }: ZoneMarkerProps) {
  const { selectedZoneId, selectZone } = useSailingStore();
  const prefetchConditions = usePrefetchConditions();
  const map = useMap();
  const isSelected = selectedZoneId === zone.id;

  const color = getSafetyColor(zone.conditions?.safetyRating);
  const icon = createZoneIcon(color, zone.isFavorite);

  const handleClick = useCallback(() => {
    selectZone(zone.id);
    map.flyTo([zone.coordinates.lat, zone.coordinates.lng], Math.max(map.getZoom(), 10), {
      duration: 0.8,
    });
  }, [zone, selectZone, map]);

  const handleMouseOver = useCallback(() => {
    prefetchConditions(zone.id);
  }, [zone.id, prefetchConditions]);

  return (
    <>
      {/* Selection ring */}
      {isSelected && (
        <CircleMarker
          center={[zone.coordinates.lat, zone.coordinates.lng]}
          radius={24}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '4 4',
          }}
        />
      )}

      <Marker
        position={[zone.coordinates.lat, zone.coordinates.lng]}
        icon={icon}
        eventHandlers={{
          click: handleClick,
          mouseover: handleMouseOver,
        }}
      >
        <Popup className={styles.popup} maxWidth={240}>
          <div className={styles.popupContent}>
            <div className={styles.popupHeader}>
              <strong className={styles.popupName}>{zone.name}</strong>
              {zone.conditions && (
                <span
                  className={styles.popupBadge}
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  {zone.conditions.safetyRating}
                </span>
              )}
            </div>

            {zone.conditions ? (
              <div className={styles.popupData}>
                <div className={styles.popupRow}>
                  <span>Wind</span>
                  <span>
                    {zone.conditions.wind.speed} kts {zone.conditions.wind.direction}°
                  </span>
                </div>
                <div className={styles.popupRow}>
                  <span>Waves</span>
                  <span>{zone.conditions.waves.height.toFixed(1)}m</span>
                </div>
                <div className={styles.popupRow}>
                  <span>Beaufort</span>
                  <span>Bf {zone.conditions.wind.beaufort}</span>
                </div>
              </div>
            ) : (
              <p className={styles.popupLoading}>Loading conditions...</p>
            )}

            <p className={styles.popupDesc}>{zone.description}</p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
