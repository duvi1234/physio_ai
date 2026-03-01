import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { normalizeRole } from "../utils/roleRedirect";
import { AUTH_STORAGE_KEYS } from "../services/api";

const hasAccess = (allowedRoles, role) => {
  if (!allowedRoles || !allowedRoles.length) return true;
  const normalizedRole = normalizeRole(role);
  return allowedRoles.map(normalizeRole).includes(normalizedRole);
};

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loadingAuth } = useAuth();
  const location = useLocation();
  const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100">
        <div className="rounded-2xl border border-white/40 bg-white/50 px-8 py-4 text-sm font-medium text-slate-700 backdrop-blur-md shadow-xl">
          Loading secure workspace...
        </div>
      </div>
    );
  }

  if (!user || !accessToken) {
    const loginPath = location.pathname.startsWith("/dashboard/patient") ? "/patient/login" : "/staff/login";
    const tokenExpired = localStorage.getItem(AUTH_STORAGE_KEYS.tokenExpired) === "1";
    return <Navigate to={loginPath} replace state={{ from: location, tokenExpired }} />;
  }

  if (!hasAccess(allowedRoles, user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
