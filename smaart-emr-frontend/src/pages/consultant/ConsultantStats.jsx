import { useEffect, useState } from "react";
import StatCard from "../../components/dashboard/StatCard";
import ToastAlert from "../../components/dashboard/ToastAlert";
import { getDashboardStats } from "../../services/consultant.service";
import { Users, Clock3, CheckCircle2, CalendarDays } from "lucide-react";

export default function ConsultantStats() {
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState({ type: "success", message: "" });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data.data);
      } catch (err) {
        setToast({ type: "error", message: err?.response?.data?.message || "Unable to load stats." });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="grid gap-4 p-6">
      <ToastAlert type={toast.type} message={toast.message} />
      {!stats ? (
        <p className="text-sm text-gray-600">Loading stats...</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} />
          <StatCard title="Pending" value={stats.pending} icon={Clock3} />
          <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} />
          <StatCard title="Today's Appointments" value={stats.todayAppointments} icon={CalendarDays} />
        </div>
      )}
    </div>
  );
}
