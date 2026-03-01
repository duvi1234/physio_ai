
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/public/LandingPage";
import AppointmentRequestForm from "../pages/public/AppointmentRequestForm";
import SetupAdmin from "../pages/auth/SetupAdmin";
import Login from "../pages/auth/Login";
import PatientRegister from "../pages/auth/PatientRegister";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ChangePassword from "../pages/auth/ChangePassword";
import AdminDashboard from "../pages/admin/Dashboard";
import NurseDashboard from "../pages/dashboard/NurseDashboard";
import PhysioDashboard from "../pages/physio/Dashboard";
import PatientDashboard from "../pages/dashboard/PatientDashboard";
import AdminPatients from "../pages/admin/Patients";
import AdminPatientView from "../pages/admin/PatientView";
import AdminAppointments from "../pages/admin/Appointments";
import AdminNurses from "../pages/admin/Nurses";
import AdminPhysios from "../pages/admin/Physios";
import AdminRequests from "../pages/admin/Requests";
import AdminReports from "../pages/admin/Reports";
import AdminSettings from "../pages/admin/Settings";
import NurseAppointments from "../pages/nurse/MyAppointments";
import NursePatients from "../pages/nurse/Patients";
import NursePatientView from "../pages/nurse/PatientView";
import NurseVitals from "../pages/nurse/Vitals";
import NurseAssessments from "../pages/nurse/PainAssessments";
import NurseNotes from "../pages/nurse/Notes";
import NurseReports from "../pages/nurse/Reports";
import NurseProfile from "../pages/nurse/Profile";
import PhysioAppointments from "../pages/physio/Appointments";
import PhysioPatientCase from "../pages/physio/PatientCase";
import PhysioReports from "../pages/physio/Reports";
import PhysioAnalytics from "../pages/physio/Analytics";
import PhysioNotifications from "../pages/physio/Notifications";
import PhysioProfile from "../pages/physio/Profile";
import MySessions from "../pages/patient/MySessions";
import PainAssessment from "../pages/patient/PainAssessment";
import TreatmentPlan from "../pages/patient/TreatmentPlan";
import ExerciseTracker from "../pages/patient/ExerciseTracker";
import PosturalAssessment from "../pages/patient/PosturalAssessment";
import MedicalRecords from "../pages/patient/MedicalRecords";
import VitalsHistory from "../pages/patient/VitalsHistory";
import ConsultationSummaries from "../pages/patient/ConsultationSummaries";
import Notifications from "../pages/patient/Notifications";
import PatientProfile from "../pages/patient/Profile";
import ProtectedRoute from "./ProtectedRoute";
import DashboardRedirect from "./DashboardRedirect";
import UnauthorizedPage from "./UnauthorizedPage";

export default function AppRouter() {
  return (
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
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/patients" element={<AdminPatients />} />
        <Route path="/admin/patients/:patientId" element={<AdminPatientView />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />
        <Route path="/admin/nurses" element={<AdminNurses />} />
        <Route path="/admin/physios" element={<AdminPhysios />} />
        <Route path="/admin/requests" element={<AdminRequests />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["NURSE"]} />}>
        <Route path="/dashboard/nurse" element={<NurseDashboard />} />
        <Route path="/dashboard/nurse/appointments" element={<NurseAppointments />} />
        <Route path="/dashboard/nurse/patients" element={<NursePatients />} />
        <Route path="/dashboard/nurse/patients/:patientId" element={<NursePatientView />} />
        <Route path="/dashboard/nurse/vitals" element={<NurseVitals />} />
        <Route path="/dashboard/nurse/assessments" element={<NurseAssessments />} />
        <Route path="/dashboard/nurse/notes" element={<NurseNotes />} />
        <Route path="/dashboard/nurse/reports" element={<NurseReports />} />
        <Route path="/dashboard/nurse/profile" element={<NurseProfile />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["CONSULTANT", "PHYSIO", "PHYSIOTHERAPIST"]} />}>
        <Route path="/dashboard/physio" element={<PhysioDashboard />} />
        <Route path="/dashboard/consultant" element={<Navigate to="/dashboard/physio" replace />} />
        <Route path="/dashboard/physio/appointments" element={<PhysioAppointments />} />
        <Route path="/dashboard/physio/patients" element={<PhysioPatientCase />} />
        <Route path="/dashboard/physio/patients/:patientId" element={<PhysioPatientCase />} />
        <Route path="/dashboard/physio/reports" element={<PhysioReports />} />
        <Route path="/dashboard/physio/analytics" element={<PhysioAnalytics />} />
        <Route path="/dashboard/physio/notifications" element={<PhysioNotifications />} />
        <Route path="/dashboard/physio/profile" element={<PhysioProfile />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/patient/sessions" element={<MySessions />} />
        <Route path="/dashboard/patient/pain-assessment" element={<PainAssessment />} />
        <Route path="/dashboard/patient/treatment-plan" element={<TreatmentPlan />} />
        <Route path="/dashboard/patient/exercises" element={<ExerciseTracker />} />
        <Route path="/dashboard/patient/postural-assessment" element={<PosturalAssessment />} />
        <Route path="/dashboard/patient/medical-records" element={<MedicalRecords />} />
        <Route path="/dashboard/patient/vitals-history" element={<VitalsHistory />} />
        <Route path="/dashboard/patient/consultation-summaries" element={<ConsultationSummaries />} />
        <Route path="/dashboard/patient/notifications" element={<Notifications />} />
        <Route path="/dashboard/patient/profile" element={<PatientProfile />} />
      </Route>
      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
