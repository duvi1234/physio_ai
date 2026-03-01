import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageWrapper from "../../components/dashboard/PageWrapper";
import DataTable from "../../components/dashboard/DataTable";
import LoadingSpinner from "../../components/dashboard/LoadingSpinner";
import ToastAlert from "../../components/dashboard/ToastAlert";
import physioService from "../../services/physio.service";
import { first, formatDate, inputClass } from "../nurse/nurse.ui";

export default function Appointments() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    tab: "TODAY",
    status: "",
    search: ""
  });
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await physioService.getAppointments(filters);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load appointments." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.tab, filters.status, filters.search]);

  const columns = useMemo(
    () => [
      { label: "Appointment ID", render: (row) => <span className="font-semibold text-cyan-700">{first(row.appointmentId)}</span> },
      { label: "Patient", render: (row) => `${first(row?.patient?.firstName, "")} ${first(row?.patient?.lastName, "")}`.trim() },
      { label: "Time", render: (row) => `${first(row.timeSlot)} (${formatDate(row.appointmentDate)})` },
      { label: "Status", render: (row) => first(row.status) },
      {
        label: "Action",
        render: (row) => (
          <div className="flex gap-2">
            <a
              href={`/dashboard/physio/patients/${row?.patient?.patientId || row?.patient?._id}`}
              className="rounded-lg bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700"
            >
              Open Case
            </a>
            <button
              onClick={() =>
                physioService
                  .updateAppointmentStatus(row.appointmentId || row._id, "IN_SESSION")
                  .then(load)
              }
              className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
            >
              In Session
            </button>
            <button
              onClick={() =>
                physioService
                  .updateAppointmentStatus(row.appointmentId || row._id, "COMPLETED")
                  .then(load)
              }
              className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              Complete
            </button>
          </div>
        )
      }
    ],
    [load]
  );

  return (
    <DashboardLayout title="Appointments">
      <PageWrapper>
        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Appointments</h2>
              <p className="text-sm text-slate-500">Filter by status and date.</p>
            </div>
            <CalendarClock className="text-cyan-600" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select
              className={inputClass}
              value={filters.tab}
              onChange={(e) => setFilters((prev) => ({ ...prev, tab: e.target.value }))}
            >
              <option value="TODAY">Today</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              className={inputClass}
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_SESSION">In Session</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <input
              className={inputClass}
              placeholder="Search patient"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        {loading ? <LoadingSpinner /> : null}
        <DataTable rows={rows} columns={columns} loading={loading} emptyMessage="No appointments found." />
      </PageWrapper>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
