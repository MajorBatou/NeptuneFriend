import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Dashboard = lazy(() => import('@pages/Dashboard'));
const Map = lazy(() => import('@pages/Map'));
const RoutePlanner = lazy(() => import('@pages/RoutePlanner'));
const Alerts = lazy(() => import('@pages/Alerts'));
const Login = lazy(() => import('@pages/Login'));
const NotFound = lazy(() => import('@pages/NotFound'));

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/map" element={<Map />} />
        <Route path="/planner" element={<RoutePlanner />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
