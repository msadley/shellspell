import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import AdminBattle from './pages/AdminBattle';
import PlayerBattle from './pages/PlayerBattle';
import AdminAuth from './pages/AdminAuth';
import AdminHome from './pages/AdminHome';
import ChangePassword from './pages/ChangePassword';
import ProtectedRoute from './components/ProtectedRoute';

function AuthSync() {
  const location = useLocation();
  const sync = useAuthStore((state) => state.sync);

  useEffect(() => {
    sync(location.pathname);
  }, [location.pathname, sync]);

  return null;
}

export default function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthSync />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminAuth />} />
        <Route
          path="/admin/home"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/change-password"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lobby/:code"
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/battle/:code"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminBattle />
            </ProtectedRoute>
          }
        />
        <Route
          path="/battle/:code"
          element={
            <ProtectedRoute requiredRole="PLAYER">
              <PlayerBattle />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
