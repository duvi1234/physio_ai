import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Users,
  CalendarClock,
  ClipboardCheck,
  Activity,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useAuth from "../hooks/useAuth";

export default function AdminLayout({ title = "Admin", children, headerAction = null }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/staff/login", { replace: true });
  };

  const navItems = useMemo(
    () => [
      { label: "Dashboard", to: "/admin/dashboard", icon: Home },
      { label: "Patients", to: "/admin/patients", icon: Users },
      { label: "Appointments", to: "/admin/appointments", icon: CalendarClock },
      { label: "Nurses", to: "/admin/nurses", icon: Users },
      { label: "Physiotherapists", to: "/admin/physios", icon: Activity },
      { label: "Requests", to: "/admin/requests", icon: ClipboardCheck },
      { label: "Reports", to: "/admin/reports", icon: BarChart3 },
      { label: "Settings", to: "/admin/settings", icon: Settings },
      { label: "Logout", icon: LogOut, action: handleLogout, danger: true }
    ],
    [handleLogout]
  );

  const resolvedAction = headerAction
    ? headerAction
    : (
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          {user?.role || "ADMIN"}
        </span>
      );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-50">
      <div className="relative flex min-h-screen">
        <Sidebar navItems={navItems} isOpen={isOpen} onClose={() => setIsOpen(false)} />

        <div className="flex min-h-screen flex-1 flex-col">
          <Header title={title} onMenuClick={() => setIsOpen(true)} action={resolvedAction} />
          <motion.main
            initial={{ opacity: 0, y: 10 }}
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
