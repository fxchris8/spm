import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const ALLOWED_ROLES = ['ADMIN', 'CREWING'];

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !ALLOWED_ROLES.includes(user.role)) {
    toast.error(`Akses ditolak. Role '${user.role}' tidak diizinkan.`);
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
