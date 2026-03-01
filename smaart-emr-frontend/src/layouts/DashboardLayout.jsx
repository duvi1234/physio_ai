import { useCallback, useMemo, useState } from "react";
import {
  Home,
  Users,
  CalendarClock,
  ClipboardCheck,
  Activity,
  FileText,
  Upload,
  HeartPulse,
  Dumbbell,
  ScanLine,
  FolderOpen,
  NotebookTabs,
  Bell,
  UserCircle2,
  LogOut,
  ShieldAlert,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useAuth from "../hooks/useAuth";

export default function DashboardLayout({ title, children, headerAction = null }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    const nextPath = String(user?.role || "").toUpperCase() === "PATIENT" ? "/patient/login" : "/staff/login";
    navigate(nextPath, { replace: true });
  }, [logout, navigate, user?.role]);

  const navItems = useMemo(() => {
    const role = String(user?.role || "").toUpperCase();
    if (role === "ADMIN") {
      return [
        { label: "Dashboard", to: "/admin/dashboard", icon: Home },
        { label: "Patients", to: "/admin/patients", icon: Users },
        { label: "Appointments", to: "/admin/appointments", icon: CalendarClock },
        { label: "Nurses", to: "/admin/nurses", icon: Users },
        { label: "Physiotherapists", to: "/admin/physios", icon: Activity },
        { label: "Requests", to: "/admin/requests", icon: ClipboardCheck },
        { label: "Reports", to: "/admin/reports", icon: BarChart3 },
        { label: "Settings", to: "/admin/settings", icon: FileText },
        { label: "Logout", icon: LogOut, action: handleLogout, danger: true }
      ];
    }
    if (role === "NURSE") {
      return [
        { label: "Dashboard", to: "/dashboard/nurse", icon: Home },
        { label: "My Appointments", to: "/dashboard/nurse/appointments", icon: CalendarClock },
        { label: "Patients", to: "/dashboard/nurse/patients", icon: Users },
        { label: "Vitals", to: "/dashboard/nurse/vitals", icon: Activity },
        { label: "Pain Assessments", to: "/dashboard/nurse/assessments", icon: ClipboardCheck },
        { label: "Notes", to: "/dashboard/nurse/notes", icon: FileText },
        { label: "Reports", to: "/dashboard/nurse/reports", icon: BarChart3 },
        { label: "Profile", to: "/dashboard/nurse/profile", icon: UserCircle2 },
        { label: "Logout", icon: LogOut, action: handleLogout, danger: true }
      ];
    }
    if (["CONSULTANT", "PHYSIO", "PHYSIOTHERAPIST"].includes(role)) {
      return [
        { label: "Dashboard", to: "/dashboard/physio", icon: Home },
        { label: "Appointments", to: "/dashboard/physio/appointments", icon: CalendarClock },
        { label: "Patients", to: "/dashboard/physio/patients", icon: Activity },
        { label: "Reports", to: "/dashboard/physio/reports", icon: FileText },
        { label: "Analytics", to: "/dashboard/physio/analytics", icon: BarChart3 },
        { label: "Notifications", to: "/dashboard/physio/notifications", icon: Bell },
        { label: "Profile", to: "/dashboard/physio/profile", icon: UserCircle2 },
        { label: "Logout", icon: LogOut, action: handleLogout, danger: true }
      ];
    }
    if (role === "PATIENT") {
      return [
        { label: "Dashboard", to: "/dashboard/patient", icon: Home },
        { label: "My Sessions", to: "/dashboard/patient/sessions", icon: CalendarClock },
        { label: "Pain Assessment", to: "/dashboard/patient/pain-assessment", icon: HeartPulse },
        { label: "Treatment Plan", to: "/dashboard/patient/treatment-plan", icon: ClipboardCheck },
        { label: "Exercises", to: "/dashboard/patient/exercises", icon: Dumbbell },
        { label: "Postural Assessment", to: "/dashboard/patient/postural-assessment", icon: ScanLine },
        { label: "Medical Records", to: "/dashboard/patient/medical-records", icon: FolderOpen },
        { label: "Vitals & History", to: "/dashboard/patient/vitals-history", icon: Activity },
        { label: "Consultation Summaries", to: "/dashboard/patient/consultation-summaries", icon: NotebookTabs },
        { label: "Notifications", to: "/dashboard/patient/notifications", icon: Bell },
        { label: "Profile", to: "/dashboard/patient/profile", icon: UserCircle2 },
        { label: "Logout", icon: LogOut, action: handleLogout, danger: true }
      ];
    }
    return [];
  }, [handleLogout, user?.role]);

  const resolvedHeaderAction = useMemo(() => {
    if (headerAction) return headerAction;
    if (String(user?.role || "").toUpperCase() !== "PATIENT") return null;
    return (
      <button
        type="button"
        onClick={() => navigate("/dashboard/patient/profile")}
        className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
      >
        My Profile
      </button>
    );
  }, [headerAction, navigate, user?.role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100">
      <div className="relative flex min-h-screen">
        <Sidebar navItems={navItems} isOpen={isOpen} onClose={() => setIsOpen(false)} />

        <div className="flex min-h-screen flex-1 flex-col">
          <Header title={title} onMenuClick={() => setIsOpen(true)} action={resolvedHeaderAction} />
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 md:p-8 lg:p-10"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
