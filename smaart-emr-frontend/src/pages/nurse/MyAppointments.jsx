import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageWrapper from "../../components/dashboard/PageWrapper";
import DataTable from "../../components/dashboard/DataTable";
import LoadingSpinner from "../../components/dashboard/LoadingSpinner";
import ToastAlert from "../../components/dashboard/ToastAlert";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { first, formatDate, inputClass, todayIso } from "./nurse.ui";

export default function MyAppointments() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState({
    date: todayIso(),
    status: "",
    search: ""
  });
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await nurseDashboardService.getAssignedAppointments(filters);
      setAppointments(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load appointments." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.date, filters.status, filters.search]);

  const columns = useMemo(
    () => [
      {
        label: "Appointment ID",
        render: (row) => <span className="font-semibold text-cyan-700">{first(row.appointmentId)}</span>
      },
      {
        label: "Patient",
        render: (row) =>
          `${first(row?.patient?.firstName, "")} ${first(row?.patient?.lastName, "")}`.trim() ||
          first(row?.patient?.patientId)
      },
      {
        label: "Time",
        render: (row) => `${first(row.timeSlot)} (${formatDate(row.appointmentDate)})`
      },
      {
        label: "Status",
        render: (row) => (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {first(row.status, "PENDING")}
          </span>
        )
      },
      {
        label: "Actions",
        render: (row) => (
          <div className="flex gap-2">
            <button
              onClick={() =>
                nurseDashboardService
                  .updateAssignedAppointmentStatus({
                    appointmentId: row.appointmentId || row._id,
                    status: "ARRIVED"
                  })
                  .then(load)
              }
              className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              Check-In
            </button>
            <button
              onClick={() =>
                nurseDashboardService
                  .updateAssignedAppointmentStatus({
                    appointmentId: row.appointmentId || row._id,
                    status: "INTAKE_COMPLETED"
                  })
                  .then(load)
              }
              className="rounded-lg bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700"
            >
              Vitals Done
            </button>
          </div>
        )
      }
    ],
    [load]
  );

  return (
    <DashboardLayout title="My Appointments">
      <PageWrapper>
        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Assigned Appointments</h2>
              <p className="text-sm text-slate-500">Track and update your sessions.</p>
            </div>
            <CalendarClock className="text-cyan-600" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              type="date"
              className={inputClass}
              value={filters.date}
              onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
            />
            <select
              className={inputClass}
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="ARRIVED">Checked-In</option>
              <option value="INTAKE_COMPLETED">Vitals Completed</option>
              <option value="READY_FOR_PT">Ready For PT</option>
            </select>
            <input
              className={inputClass}
              placeholder="Search patient or ID"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        {loading ? <LoadingSpinner /> : null}
        <DataTable rows={appointments} columns={columns} loading={loading} emptyMessage="No appointments found." />
      </PageWrapper>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
