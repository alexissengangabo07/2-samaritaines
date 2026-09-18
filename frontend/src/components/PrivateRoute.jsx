import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  // 1. Attendre la fin de la vérification du token
  if (loading) return null;

  // 2. Si pas d'utilisateur après vérification, rediriger vers Login
  if (!user) return <Navigate to="/login" replace />;

  // 3. Vérification des rôles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;