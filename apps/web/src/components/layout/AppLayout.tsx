import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { useOfflineDetector } from '@/hooks';
import { useNavShortcuts } from '@/hooks';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { AlertBell } from '@/components/alerts';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  useOfflineDetector();
  useNavShortcuts();

  return (
    <div className={styles.layout}>
      <OfflineBanner />
      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.navBrand}>
          <span className={styles.anchor} aria-hidden="true">
            ⚓
          </span>
          <span className={styles.brandName}>NeptuneFriend</span>
        </div>

        <div className={styles.navLinks}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            Map
          </NavLink>
          <NavLink
            to="/planner"
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            Route Planner
          </NavLink>
          <NavLink
            to="/alerts"
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            Alerts
          </NavLink>
        </div>

        <div className={styles.navUser}>
          <AlertBell />
          {user && (
            <>
              <span className={styles.userName} aria-label={`Signed in as ${user.name}`}>
                {user.name}
              </span>
              <button
                onClick={() => logout()}
                className={styles.logoutBtn}
                aria-label="Sign out of NeptuneFriend"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>

      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
