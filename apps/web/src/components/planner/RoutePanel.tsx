import { useState } from 'react';
import { useRouteStore } from '@/store';
import { useToastStore } from '@/store';
import { Button, Input } from '@/components/ui';
import { formatNauticalMiles } from '@/utils/sailing';
import styles from './RoutePanel.module.css';

export default function RoutePanel() {
  const [routeName, setRouteName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const {
    routes,
    activeRouteId,
    draftWaypoints,
    isDrawing,
    setDrawing,
    clearDraft,
    saveRoute,
    deleteRoute,
    selectRoute,
    removeWaypoint,
    getDraftDistance,
    getDraftEstimatedTime,
  } = useRouteStore();
  const toast = useToastStore();

  const draftDistance = getDraftDistance();
  const draftTime = getDraftEstimatedTime(6);

  function handleStartDrawing() {
    clearDraft();
    setDrawing(true);
  }

  function handleSaveRoute() {
    if (!routeName.trim()) {
      toast.warning('Please enter a route name');
      return;
    }
    if (draftWaypoints.length < 2) {
      toast.warning('Add at least 2 waypoints before saving');
      return;
    }
    const route = saveRoute(routeName.trim());
    if (route) {
      toast.success(`Route "${route.name}" saved`);
      setRouteName('');
      setShowSaveForm(false);
    }
  }

  function handleDeleteRoute(routeId: string, name: string) {
    deleteRoute(routeId);
    toast.success(`Route "${name}" deleted`);
  }

  function handleExportGPX(routeId: string) {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="NeptuneFriend">
  <rte>
    <name>${route.name}</name>
    ${route.waypoints
      .map(
        (wp, i) => `
    <rtept lat="${wp.lat}" lon="${wp.lng}">
      <name>${wp.name ?? `WP${i + 1}`}</name>
    </rtept>`
      )
      .join('')}
  </rte>
</gpx>`;

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name.replace(/\s+/g, '_')}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('GPX file downloaded');
  }

  return (
    <div className={styles.panel}>
      {/* Drawing controls */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Route planner</h2>

        {!isDrawing ? (
          <Button variant="primary" size="sm" fullWidth onClick={handleStartDrawing}>
            + Draw new route
          </Button>
        ) : (
          <div className={styles.drawingControls}>
            <div className={styles.draftStats}>
              <span className={styles.draftStat}>{draftWaypoints.length} waypoints</span>
              {draftDistance > 0 && (
                <>
                  <span className={styles.draftSep}>·</span>
                  <span className={styles.draftStat}>{formatNauticalMiles(draftDistance)}</span>
                  <span className={styles.draftSep}>·</span>
                  <span className={styles.draftStat}>~{draftTime.toFixed(1)}h @ 6kts</span>
                </>
              )}
            </div>

            {draftWaypoints.length >= 2 && !showSaveForm && (
              <Button variant="primary" size="sm" fullWidth onClick={() => setShowSaveForm(true)}>
                Save route
              </Button>
            )}

            {showSaveForm && (
              <div className={styles.saveForm}>
                <Input
                  placeholder="Route name"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRoute()}
                  autoFocus
                />
                <div className={styles.saveActions}>
                  <Button variant="ghost" size="sm" onClick={() => setShowSaveForm(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveRoute}>
                    Save
                  </Button>
                </div>
              </div>
            )}

            <Button variant="ghost" size="sm" fullWidth onClick={clearDraft}>
              Discard draft
            </Button>
          </div>
        )}
      </div>

      {/* Waypoint list (draft) */}
      {isDrawing && draftWaypoints.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.subsectionTitle}>Waypoints</h3>
          <ol className={styles.waypointList}>
            {draftWaypoints.map((wp, i) => (
              <li key={wp.id} className={styles.waypointItem}>
                <span className={styles.waypointNum}>{i + 1}</span>
                <span className={styles.waypointCoords}>
                  {wp.lat.toFixed(3)}°, {wp.lng.toFixed(3)}°
                </span>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeWaypoint(wp.id)}
                  aria-label={`Remove waypoint ${i + 1}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Saved routes */}
      <div className={styles.section}>
        <h3 className={styles.subsectionTitle}>Saved routes ({routes.length})</h3>

        {routes.length === 0 ? (
          <p className={styles.empty}>No saved routes yet</p>
        ) : (
          <ul className={styles.routeList}>
            {routes.map((route) => (
              <li
                key={route.id}
                className={[
                  styles.routeItem,
                  activeRouteId === route.id ? styles.routeItemActive : '',
                ].join(' ')}
              >
                <button
                  className={styles.routeSelectBtn}
                  onClick={() => selectRoute(activeRouteId === route.id ? null : route.id)}
                >
                  <span className={styles.routeName}>{route.name}</span>
                  <span className={styles.routeMeta}>
                    {route.waypoints.length} pts · {formatNauticalMiles(route.totalDistance)}
                    {' · '}~{route.estimatedTime.toFixed(1)}h
                  </span>
                </button>

                <div className={styles.routeActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleExportGPX(route.id)}
                    title="Export GPX"
                    aria-label={`Export ${route.name} as GPX`}
                  >
                    ↓
                  </button>
                  <button
                    className={[styles.actionBtn, styles.actionBtnDanger].join(' ')}
                    onClick={() => handleDeleteRoute(route.id, route.name)}
                    title="Delete route"
                    aria-label={`Delete ${route.name}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
