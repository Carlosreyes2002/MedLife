import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { token, isAdmin } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/patients" replace state={{ forbidden: 'users' }} />;
  }

  return children;
}
