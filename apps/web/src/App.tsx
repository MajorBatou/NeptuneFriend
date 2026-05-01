import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { SkipLink, LoadingPage } from '@/components/ui';
import { useWebVitals } from '@/hooks';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Map = lazy(() => import('@/pages/Map'));
const RoutePlanner = lazy(() => import('@/pages/RoutePlanner'));
const Alerts = lazy(() => import('@/pages/Alerts'));
const Login = lazy(() => import('@/pages/Login'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const Historical = lazy(() => import('@/pages/Historical'));

export default function App() {
  useWebVitals();

  return (
    <>
      <SkipLink />
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map" element={<Map />} />
            <Route path="/planner" element={<RoutePlanner />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/historical" element={<Historical />} />
          </Route>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
