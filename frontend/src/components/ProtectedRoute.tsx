import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const ALLOWED_ROLES = ['ADMIN', 'CREWING', 'user', 'superadmin'];

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Wait for session restore before deciding to redirect
  if (isLoading) {
    return null; // or a loading spinner
  } 

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !ALLOWED_ROLES.includes(user.role)) {
    toast.error(`Akses ditolak. Role '${user.role}' tidak diizinkan.`); 
    return <Navigate to="/login" replace />;
  }

  
  return <Outlet />;
}
