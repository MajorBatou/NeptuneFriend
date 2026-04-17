import { useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useRouteStore } from '@/store';
import { formatNauticalMiles } from '@/utils/sailing';
import 'leaflet/dist/leaflet.css';
import styles from './RouteMap.module.css';

// Fix Leaflet icon
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

function waypointIcon(index: number, isFirst: boolean, isLast: boolean) {
  const color = isFirst ? '#22c55e' : isLast ? '#ef4444' : '#2d7dd2';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 28px; height: 28px; border-radius: 50%;
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; color: white;
        font-family: sans-serif;
      ">${index + 1}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -18],
  });
}

function MapClickHandler() {
  const { isDrawing, addWaypoint } = useRouteStore();

  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      addWaypoint(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

function RoutePolyline() {
  const { draftWaypoints, activeRouteId, routes } = useRouteStore();
  const activeRoute = routes.find((r) => r.id === activeRouteId);
  const waypoints = draftWaypoints.length > 0 ? draftWaypoints : (activeRoute?.waypoints ?? []);

  if (waypoints.length < 2) return null;

  const positions = waypoints.map((w) => [w.lat, w.lng] as [number, number]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#2d7dd2',
        weight: 3,
        opacity: 0.8,
        dashArray: draftWaypoints.length > 0 ? '8 4' : undefined,
      }}
    />
  );
}

export default function RouteMap() {
  const { draftWaypoints, activeRouteId, routes, isDrawing, removeWaypoint } = useRouteStore();
  const activeRoute = routes.find((r) => r.id === activeRouteId);
  const displayWaypoints = useMemo(
    () => (draftWaypoints.length > 0 ? draftWaypoints : (activeRoute?.waypoints ?? [])),
    [draftWaypoints, activeRoute?.waypoints]
  );
  const mapRef = useRef<L.Map | null>(null);

  // Fit map to waypoints when route is selected
  useEffect(() => {
    if (!mapRef.current || displayWaypoints.length < 2) return;
    const bounds = L.latLngBounds(displayWaypoints.map((w) => [w.lat, w.lng]));
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  }, [activeRouteId, displayWaypoints]);
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  return (
    <div className={styles.wrapper}>
      {isDrawing && <div className={styles.drawingBanner}>Click on the map to add waypoints</div>}

      <MapContainer
        center={[51.5, -0.1]}
        zoom={7}
        className={styles.map}
        zoomControl={false}
        ref={handleMapReady as unknown as React.Ref<L.Map>}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <MapClickHandler />
        <RoutePolyline />

        {displayWaypoints.map((wp, i) => (
          <Marker
            key={wp.id}
            position={[wp.lat, wp.lng]}
            icon={waypointIcon(i, i === 0, i === displayWaypoints.length - 1)}
          >
            <Popup>
              <div style={{ minWidth: 140, padding: '4px 0' }}>
                <strong style={{ fontSize: 13 }}>{wp.name ?? `Waypoint ${i + 1}`}</strong>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {wp.lat.toFixed(4)}°N, {wp.lng.toFixed(4)}°E
                </div>
                {i > 0 && draftWaypoints.length > 0 && (
                  <button
                    onClick={() => removeWaypoint(wp.id)}
                    style={{
                      marginTop: 8,
                      padding: '3px 10px',
                      fontSize: 12,
                      border: '1px solid #ef4444',
                      borderRadius: 4,
                      background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {displayWaypoints.length >= 2 && (
        <div className={styles.distanceBadge}>
          {formatNauticalMiles(
            displayWaypoints.reduce((acc, wp, i) => {
              if (i === 0) return 0;
              const prev = displayWaypoints[i - 1];
              const R = 3440.065;
              const dLat = ((wp.lat - prev.lat) * Math.PI) / 180;
              const dLng = ((wp.lng - prev.lng) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos((prev.lat * Math.PI) / 180) *
                  Math.cos((wp.lat * Math.PI) / 180) *
                  Math.sin(dLng / 2) ** 2;
              return acc + R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            }, 0)
          )}
        </div>
      )}
    </div>
  );
}
