import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ClipboardCheck, Activity, Stethoscope } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/dashboard/StatCard";
import PageWrapper from "../../components/dashboard/PageWrapper";
import DataTable from "../../components/dashboard/DataTable";
import LoadingSpinner from "../../components/dashboard/LoadingSpinner";
import ToastAlert from "../../components/dashboard/ToastAlert";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { first, formatDate, formatDateTime, todayIso } from "../nurse/nurse.ui";

export default function NurseDashboard() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, apptRes] = await Promise.all([
        nurseDashboardService.getDashboardStats(),
        nurseDashboardService.getAssignedAppointments({ date: todayIso() })
      ]);
      setStats(statsRes || {});
      setAppointments(Array.isArray(apptRes) ? apptRes : []);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load nurse dashboard." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const columns = useMemo(
    () => [
      {
        label: "Time",
        render: (row) => (
          <div>
            <div className="font-semibold text-slate-900">{first(row.timeSlot)}</div>
            <div className="text-xs text-slate-500">{formatDate(row.appointmentDate)}</div>
          </div>
        )
      },
      {
        label: "Patient",
        render: (row) =>
          `${first(row?.patient?.firstName, "")} ${first(row?.patient?.lastName, "")}`.trim() ||
          first(row?.patient?.patientId)
      },
      {
        label: "Physio",
        render: (row) => first(row?.physiotherapist?.name || row?.physiotherapist?.userId)
      },
      {
        label: "Status",
        render: (row) => (
          <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
            {first(row.status, "PENDING")}
          </span>
        )
      }
    ],
    []
  );

  const statsCards = [
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: CalendarClock,
      accent: "from-blue-600 to-cyan-500"
    },
    {
      title: "Checked-In Patients",
      value: stats?.checkedIn || 0,
      icon: ClipboardCheck,
      accent: "from-emerald-500 to-teal-500"
    },
    {
      title: "Vitals Entered Today",
      value: stats?.vitalsToday || 0,
      icon: Activity,
      accent: "from-amber-500 to-orange-500"
    },
    {
      title: "Pain Assessments Done",
      value: stats?.painToday || 0,
      icon: Stethoscope,
      accent: "from-indigo-500 to-violet-500"
    }
  ];

  return (
    <DashboardLayout title="Nurse Dashboard">
      <PageWrapper>
        {loading ? <LoadingSpinner /> : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h3>
              <p className="text-xs text-slate-500">Updated {formatDateTime(new Date())}</p>
            </div>
            <div className="flex gap-3">
              <a
                href="/dashboard/nurse/vitals"
                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
              >
                Add Vitals
              </a>
              <a
                href="/dashboard/nurse/assessments"
                className="rounded-xl border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-700"
              >
                Add Pain Assessment
              </a>
            </div>
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
