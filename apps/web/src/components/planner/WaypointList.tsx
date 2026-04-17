import { useState } from 'react';
import { usePlannerStore } from '@/store';
import type { Waypoint } from '@/types';
import styles from './WaypointList.module.css';

export default function WaypointList() {
  const { draftWaypoints, isDrafting, removeWaypoint, reorderWaypoints } = usePlannerStore();

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  if (draftWaypoints.length === 0) {
    return (
      <div className={styles.empty}>
        {isDrafting ? 'Click on the map to add waypoints' : 'No waypoints yet — start a new route'}
      </div>
    );
  }

  function handleDragStart(i: number) {
    setDragIdx(i);
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;

    const updated = [...draftWaypoints];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(i, 0, moved);
    reorderWaypoints(updated);
    setDragIdx(i);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  return (
    <ul className={styles.list} aria-label="Route waypoints">
      {draftWaypoints.map((wp: Waypoint, i: number) => {
        const isStart = i === 0;
        const isEnd = i === draftWaypoints.length - 1;
        const label = isStart ? 'Start' : isEnd ? 'End' : `Waypoint ${i}`;
        const dotColor = isStart ? '#22c55e' : isEnd ? '#ef4444' : '#2d7dd2';

        return (
          <li
            key={wp.id}
            className={[styles.item, dragIdx === i ? styles.dragging : ''].join(' ')}
            draggable={isDrafting && draftWaypoints.length > 1}
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            aria-label={`${label}: ${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}`}
          >
            <div className={styles.itemLeft}>
              {isDrafting && draftWaypoints.length > 1 && (
                <span className={styles.dragHandle} aria-hidden="true">
                  ⋮⋮
                </span>
              )}
              <span
                className={styles.dot}
                style={{ backgroundColor: dotColor }}
                aria-hidden="true"
              />
              <div className={styles.info}>
                <span className={styles.label}>{wp.name ?? label}</span>
                <span className={styles.coords}>
                  {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                </span>
              </div>
            </div>

            {isDrafting && (
              <button
                className={styles.removeBtn}
                onClick={() => removeWaypoint(wp.id)}
                aria-label={`Remove ${label}`}
              >
                ✕
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
