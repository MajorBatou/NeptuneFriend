import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useZones } from '@/hooks';
import { degreesToCompass } from '@/utils/sailing';

function createWindArrow(speed: number, direction: number): L.DivIcon {
  const color = speed < 11 ? '#22c55e' : speed < 22 ? '#f59e0b' : '#ef4444';

  const size = speed < 11 ? 20 : speed < 22 ? 24 : 28;

  return L.divIcon({
    className: '',
    html: `
      <div style="
        transform: rotate(${direction}deg);
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3 L16 14 L12 11 L8 14 Z"
            fill="${color}"
            opacity="0.85"
          />
          <line x1="12" y1="11" x2="12" y2="21"
            stroke="${color}" stroke-width="2"
            stroke-linecap="round" opacity="0.85"
          />
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function WindOverlay() {
  const map = useMap();
  const { data: zones } = useZones();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!zones) return;

    zones.forEach((zone) => {
      if (!zone.conditions) return;

      const { wind } = zone.conditions;
      const icon = createWindArrow(wind.speed, wind.direction);

      const marker = L.marker([zone.coordinates.lat + 0.05, zone.coordinates.lng + 0.05], {
        icon,
        interactive: false,
        zIndexOffset: -100,
      });

      // Wind speed tooltip on hover
      marker.bindTooltip(`${wind.speed} kts ${degreesToCompass(wind.direction)}`, {
        direction: 'top',
        offset: [0, -8],
        className: 'wind-tooltip',
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, zones]);

  return null;
}
