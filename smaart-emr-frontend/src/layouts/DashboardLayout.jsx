import { useMemo, useState } from "react";
import { Home, Users, CalendarClock, ClipboardCheck, Activity, FileText, Upload } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useAuth from "../hooks/useAuth";

const navByRole = {
  ADMIN: [
    { label: "Overview", to: "/dashboard/admin", icon: Home },
    { label: "Patients", to: "/dashboard/admin", icon: Users },
    { label: "Appointments", to: "/dashboard/admin", icon: CalendarClock },
    { label: "Requests", to: "/dashboard/admin", icon: ClipboardCheck }
  ],
  NURSE: [
    { label: "Overview", to: "/dashboard/nurse", icon: Home },
    { label: "Vitals Queue", to: "/dashboard/nurse", icon: Activity },
    { label: "Record Vitals", to: "/dashboard/nurse", icon: ClipboardCheck }
  ],
  CONSULTANT: [
    { label: "Overview", to: "/dashboard/consultant", icon: Home },
    { label: "Appointments", to: "/dashboard/consultant", icon: CalendarClock },
    { label: "Patient Vitals", to: "/dashboard/consultant", icon: Activity },
    { label: "Consultation", to: "/dashboard/consultant", icon: FileText }
  ],
  PATIENT: [
    { label: "Overview", to: "/dashboard/patient", icon: Home },
    { label: "My Appointments", to: "/dashboard/patient", icon: CalendarClock },
    { label: "Records Upload", to: "/dashboard/patient", icon: Upload }
  ]
};

export default function DashboardLayout({ title, children }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navItems = useMemo(() => navByRole[user?.role] || [], [user?.role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100">
      <div className="relative flex min-h-screen">
        <Sidebar navItems={navItems} isOpen={isOpen} onClose={() => setIsOpen(false)} />

        <div className="flex min-h-screen flex-1 flex-col">
          <Header title={title} onMenuClick={() => setIsOpen(true)} />
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
