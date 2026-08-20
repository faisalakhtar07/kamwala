import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthed, initializing } = useAuth();
  if (initializing) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}
