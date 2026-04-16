import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { useOfflineDetector } from '@/hooks';
import OfflineBanner from '@/components/ui/OfflineBanner';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  useOfflineDetector();

  return (
    <div className={styles.layout}>
      <OfflineBanner />

      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <span className={styles.anchor}>⚓</span>
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
          {user && (
            <>
              <span className={styles.userName}>{user.name}</span>
              <button onClick={() => logout()} className={styles.logoutBtn}>
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
