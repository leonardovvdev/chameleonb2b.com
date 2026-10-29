import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../core/contexts/auth.context";

export default function ProtectedRoute() {
  const { session, loadingAuth } = useAuth();

  if (loadingAuth) {
    return <div>Verificando sesión...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}