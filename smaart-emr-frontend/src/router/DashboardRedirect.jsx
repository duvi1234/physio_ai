import useAuth from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { roleRedirect } from "../utils/roleRedirect";

export default function DashboardRedirect() {
  const { user, loadingAuth } = useAuth();
  if (loadingAuth) return null;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={roleRedirect(user.role)} replace />;
}
