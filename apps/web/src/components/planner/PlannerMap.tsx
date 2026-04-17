import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useRouteStore } from '@/store';
import MapControls from '@/components/map/MapControls';
import 'leaflet/dist/leaflet.css';
import styles from './PlannerMap.module.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

function createWaypointIcon(index: number, isLast: boolean) {
  const color = index === 0 ? '#22c55e' : isLast ? '#ef4444' : '#2d7dd2';
  const label = index === 0 ? 'S' : isLast ? 'E' : `${index}`;
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;font-family:sans-serif;cursor:pointer;">${label}</div>`,
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

export default function PlannerMap() {
  const { draftWaypoints, isDrawing, removeWaypoint, activeRouteId, routes } = useRouteStore();
  const activeRoute = routes.find((r) => r.id === activeRouteId);
  const displayWaypoints = isDrawing ? draftWaypoints : (activeRoute?.waypoints ?? []);
  const routePositions = displayWaypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);

  return (
    <div className={styles.wrapper}>
      {isDrawing && (
        <div className={styles.hint} role="status">
          Click on the map to add waypoints
        </div>
      )}
      <MapContainer center={[51.5, -0.1]} zoom={7} className={styles.map} zoomControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapClickHandler />
        <MapControls />
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: isDrawing ? '#2d7dd2' : '#1a4b6e',
              weight: 3,
              dashArray: isDrawing ? '8 6' : undefined,
              opacity: 0.8,
            }}
          />
        )}
        {displayWaypoints.map((wp, i) => (
          <Marker
            key={wp.id}
            position={[wp.lat, wp.lng]}
            icon={createWaypointIcon(i, i === displayWaypoints.length - 1)}
          >
            <Popup>
              <div style={{ padding: '4px', minWidth: '140px' }}>
                <strong style={{ fontSize: '13px' }}>
                  {wp.name ??
                    (i === 0
                      ? 'Start'
                      : i === displayWaypoints.length - 1
                        ? 'End'
                        : `Waypoint ${i}`)}
                </strong>
                <div style={{ fontSize: '11px', color: '#64748b', margin: '4px 0' }}>
                  {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                </div>
                {isDrawing && (
                  <button
                    onClick={() => removeWaypoint(wp.id)}
                    style={{
                      fontSize: '11px',
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Remove waypoint
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
