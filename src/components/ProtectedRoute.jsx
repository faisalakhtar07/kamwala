import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { isAuthed, initializing, user } = useAuth();
  if (initializing) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (requireRole && user?.role !== requireRole) {
    return <Navigate to={user?.role === 'worker' ? '/worker' : '/dashboard'} replace />;
  }
  return children;
}
