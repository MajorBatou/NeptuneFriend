import { useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { useSailingStore } from '@/store';
import styles from './MapControls.module.css';

export default function MapControls() {
  const map = useMap();
  const { setMapCenter, setMapZoom } = useSailingStore();

  const zoomIn = useCallback(() => {
    const newZoom = Math.min(map.getZoom() + 1, 18);
    map.setZoom(newZoom);
    setMapZoom(newZoom);
  }, [map, setMapZoom]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(map.getZoom() - 1, 3);
    map.setZoom(newZoom);
    setMapZoom(newZoom);
  }, [map, setMapZoom]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 10, { duration: 1 });
        setMapCenter({ lat: latitude, lng: longitude });
        setMapZoom(10);
      },
      () => {
        console.warn('Geolocation unavailable');
      }
    );
  }, [map, setMapCenter, setMapZoom]);

  const resetView = useCallback(() => {
    map.flyTo([51.5, -0.1], 7, { duration: 0.8 });
    setMapCenter({ lat: 51.5, lng: -0.1 });
    setMapZoom(7);
  }, [map, setMapCenter, setMapZoom]);

  return (
    <div className={styles.controls}>
      <button className={styles.btn} onClick={zoomIn} aria-label="Zoom in" title="Zoom in">
        +
      </button>
      <button className={styles.btn} onClick={zoomOut} aria-label="Zoom out" title="Zoom out">
        −
      </button>
      <div className={styles.divider} />
      <button
        className={styles.btn}
        onClick={locateMe}
        aria-label="Find my location"
        title="My location"
      >
        ◎
      </button>
      <button
        className={styles.btn}
        onClick={resetView}
        aria-label="Reset map view"
        title="Reset view"
      >
        ⌂
      </button>
    </div>
  );
}
