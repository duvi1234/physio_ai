import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarClock, CheckCircle2, ClipboardList, Sparkles } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/dashboard/StatCard";
import PageWrapper from "../../components/dashboard/PageWrapper";
import DataTable from "../../components/dashboard/DataTable";
import LoadingSpinner from "../../components/dashboard/LoadingSpinner";
import ToastAlert from "../../components/dashboard/ToastAlert";
import physioService from "../../services/physio.service";
import { first, formatDate } from "../nurse/nurse.ui";

export default function PhysioDashboard() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, appts] = await Promise.all([
        physioService.getDashboard(),
        physioService.getAppointments({ tab: "UPCOMING" })
      ]);
      setStats(statsRes || {});
      setAppointments(Array.isArray(appts) ? appts : []);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load physio dashboard." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { label: "Time", render: (row) => `${first(row.timeSlot)} (${formatDate(row.appointmentDate)})` },
      {
        label: "Patient",
        render: (row) =>
          `${first(row?.patient?.firstName, "")} ${first(row?.patient?.lastName, "")}`.trim() ||
          first(row?.patient?.patientId)
      },
      { label: "Visit Type", render: (row) => first(row.appointmentType) },
      { label: "Status", render: (row) => first(row.status) },
      {
        label: "Action",
        render: (row) => (
          <a
            href={`/dashboard/physio/patients/${row?.patient?.patientId || row?.patient?._id}`}
            className="rounded-lg bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700"
          >
            Open Case
          </a>
        )
      }
    ],
    []
  );

  const statsCards = [
    { title: "Today's Appointments", value: stats?.todayAppointments || 0, icon: CalendarClock, accent: "from-blue-600 to-cyan-500" },
    { title: "Ongoing Treatment Plans", value: stats?.activePlans || 0, icon: Activity, accent: "from-emerald-500 to-teal-500" },
    { title: "Completed Sessions Today", value: stats?.completedToday || 0, icon: CheckCircle2, accent: "from-amber-500 to-orange-500" },
    { title: "Pending Assessments", value: stats?.pendingAssessments || 0, icon: ClipboardList, accent: "from-indigo-500 to-violet-500" },
    { title: "Follow-ups Due", value: stats?.followUpsDue || 0, icon: Sparkles, accent: "from-rose-500 to-pink-500" }
  ];

  return (
    <DashboardLayout title="Physiotherapist Dashboard">
      <PageWrapper>
        {loading ? <LoadingSpinner /> : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {statsCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h3>
              <p className="text-xs text-slate-500">Open case to begin consultation.</p>
            </div>
            <a
              href="/dashboard/physio/appointments"
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
            >
              View Schedule
            </a>
          </div>
          <div className="mt-4">
            <DataTable rows={appointments} columns={columns} loading={loading} emptyMessage="No upcoming appointments." />
          </div>
        </div>
      </PageWrapper>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
