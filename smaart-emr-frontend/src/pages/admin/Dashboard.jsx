import { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, Stethoscope, CalendarClock, ClipboardCheck, Activity } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import PageWrapper from "../../components/admin/PageWrapper";
import StatCard from "../../components/admin/StatCard";
import DataTable from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import EmptyState from "../../components/admin/EmptyState";
import { Toast } from "../../components/admin/Toast";
import adminService from "../../services/admin.service";

const toArray = (payload) => (Array.isArray(payload) ? payload : []);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        adminService.dashboard.stats(),
        adminService.dashboard.activityLog({ page: 1, limit: 8 })
      ]);

      setStats(statsRes?.data || null);
      setActivity(toArray(activityRes?.data?.items || activityRes?.data));
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load dashboard data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const statCards = useMemo(
    () => [
      {
        label: "Total Patients",
        value: stats?.totalPatients || 0,
        icon: Users,
        gradient: "from-blue-600 via-cyan-500 to-teal-500"
      },
      {
        label: "Active Patients",
        value: stats?.activePatients || 0,
        icon: UserCheck,
        gradient: "from-emerald-500 via-teal-500 to-cyan-500"
      },
      {
        label: "Total Nurses",
        value: stats?.totalNurses || 0,
        icon: Activity,
        gradient: "from-indigo-500 via-blue-500 to-cyan-500"
      },
      {
        label: "Total Physios",
        value: stats?.totalPhysios || 0,
        icon: Stethoscope,
        gradient: "from-violet-500 via-indigo-500 to-blue-500"
      },
      {
        label: "Today Appointments",
        value: stats?.todayAppointments || 0,
        icon: CalendarClock,
        gradient: "from-amber-500 via-orange-500 to-rose-500"
      },
      {
        label: "Pending Requests",
        value: stats?.pendingRequests || 0,
        icon: ClipboardCheck,
        gradient: "from-rose-500 via-pink-500 to-fuchsia-500"
      }
    ],
    [stats]
  );

  const appointmentColumns = [
    {
      key: "appointmentId",
      label: "Appointment ID",
      render: (value) => <span className="font-semibold text-cyan-700">{value || "-"}</span>
    },
    {
      key: "patient",
      label: "Patient",
      render: (_, row) =>
        `${row?.patient?.firstName || ""} ${row?.patient?.lastName || ""}`.trim() ||
        row?.patient?.patientId ||
        "-"
    },
    {
      key: "physiotherapist",
      label: "Physio",
      render: (_, row) => row?.physiotherapist?.name || row?.physiotherapist?.userId || "-"
    },
    {
      key: "appointmentDate",
      label: "Date",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "-")
    },
    { key: "timeSlot", label: "Time" },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />
    }
  ];

  const userColumns = [
    {
      key: "userId",
      label: "User ID",
      render: (value) => <span className="font-semibold text-cyan-700">{value || "-"}</span>
    },
    { key: "name", label: "Name" },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {value || "ROLE"}
        </span>
      )
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "-")
    }
  ];

  return (
    <AdminLayout title="Admin Dashboard">
      <PageWrapper>
        {loading ? <LoadingSpinner label="Loading dashboard analytics..." /> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h3>
              <span className="text-xs text-slate-500">Next 6 sessions</span>
            </div>
            {stats?.upcomingAppointments?.length ? (
              <DataTable columns={appointmentColumns} data={stats.upcomingAppointments} paginate={false} sortable={false} />
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="No upcoming appointments"
                message="Upcoming appointments will appear here."
              />
            )}
          </div>

          <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Recently Created Users</h3>
              <span className="text-xs text-slate-500">Newest 6 users</span>
            </div>
            {stats?.recentUsers?.length ? (
              <DataTable columns={userColumns} data={stats.recentUsers} paginate={false} sortable={false} />
            ) : (
              <EmptyState icon={Users} title="No recent users" message="Newly created users appear here." />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Activity Log</h3>
            <span className="text-xs text-slate-500">Latest admin actions</span>
          </div>
          {activity.length ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item._id} className="rounded-xl border border-slate-200 bg-white/60 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-semibold text-slate-900">
                      {item?.performedBy?.name || "System"} - {item?.action || "ACTION"}
                    </div>
                    <span className="text-xs text-slate-500">
                      {item?.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {item?.entityType || "Entity"} {item?.entityId ? `(${item.entityId})` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={ClipboardCheck} title="No activity yet" message="Recent admin actions will appear here." />
          )}
        </div>
      </PageWrapper>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </AdminLayout>
  );
}
