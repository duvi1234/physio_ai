import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { roleRedirect } from "../utils/roleRedirect";
import ProtectedRoute from "./ProtectedRoute";

import LandingPage from "../pages/public/LandingPage";
import AppointmentRequestForm from "../pages/public/AppointmentRequestForm";
import SetupAdmin from "../pages/auth/SetupAdmin";
import Login from "../pages/auth/Login";
import PatientRegister from "../pages/auth/PatientRegister";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ChangePassword from "../pages/auth/ChangePassword";

import AdminDashboard from "../pages/dashboard/AdminDashboard";
import NurseDashboard from "../pages/dashboard/NurseDashboard";
import ConsultantDashboard from "../pages/dashboard/ConsultantDashboard";
import PatientDashboard from "../pages/dashboard/PatientDashboard";

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 p-6">
      <div className="rounded-2xl border border-white/20 bg-white/20 p-8 text-center shadow-xl backdrop-blur-md">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Unauthorized Access</h1>
        <p className="mt-2 text-sm text-slate-600">Your role does not have permission to access this route.</p>
      </div>
    </div>
  );
}

function DashboardRedirect() {
  const { user, loadingAuth } = useAuth();
  if (loadingAuth) return null;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={roleRedirect(user.role)} replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/request-appointment" element={<AppointmentRequestForm />} />
        <Route path="/setup-admin" element={<SetupAdmin />} />

        <Route path="/staff/login" element={<Login />} />
        <Route path="/patient/login" element={<Login />} />
        <Route path="/patient/register" element={<PatientRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["NURSE"]} />}>
          <Route path="/dashboard/nurse" element={<NurseDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["CONSULTANT"]} />}>
          <Route path="/dashboard/consultant" element={<ConsultantDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
          <Route path="/dashboard/patient" element={<PatientDashboard />} />
        </Route>

        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
