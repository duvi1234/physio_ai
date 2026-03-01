import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { first, formatDate, glassCardClass, inputClass, todayIso } from "./nurse.ui";

const statusOptions = ["ALL", "PENDING", "CONFIRMED", "ARRIVED", "INTAKE_COMPLETED", "READY_FOR_PT", "COMPLETED"];

export default function TodaysAppointments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    status: "ALL",
    physiotherapistId: "",
    time: ""
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await nurseDashboardService.getTodayAppointments({
        date: todayIso(),
        status: filters.status === "ALL" ? "" : filters.status,
        physiotherapistId: filters.physiotherapistId,
        time: filters.time
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load today's appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.status, filters.physiotherapistId, filters.time]);

  const physios = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const id = row?.physiotherapist?._id || row?.physiotherapist?.physioId || row?.physiotherapist?.userId;
      if (!id || map.has(id)) return;
      map.set(id, {
        id,
        name: row?.physiotherapist?.name || "Physiotherapist"
      });
    });
    return Array.from(map.values());
  }, [rows]);

  const updateStatus = async (appointmentId, status) => {
    setSaving(`${appointmentId}-${status}`);
    setError("");
    setMessage("");
    try {
      await nurseDashboardService.updateAppointmentStatus({ appointmentId, status });
      setMessage(`Appointment marked as ${status}.`);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Status update failed.");
    } finally {
      setSaving("");
    }
  };

  return (
    <DashboardLayout title="Today's Appointments">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className={`${glassCardClass} mb-6`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Filters</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className={inputClass}
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            {statusOptions.map((row) => (
              <option key={row} value={row}>
                {row.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={filters.physiotherapistId}
            onChange={(e) => setFilters((prev) => ({ ...prev, physiotherapistId: e.target.value }))}
          >
            <option value="">All Physiotherapists</option>
            {physios.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Time slot filter (e.g. 10:00 AM)"
            value={filters.time}
            onChange={(e) => setFilters((prev) => ({ ...prev, time: e.target.value }))}
          />
        </div>
      </section>

      <section className={glassCardClass}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Today Session Queue</h3>
        {loading ? <p className="text-sm text-slate-600">Loading appointments...</p> : null}
        <div className="overflow-x-auto rounded-xl bg-white/35">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2">Physiotherapist</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const appointmentId = row.appointmentId || row._id;
                return (
                  <motion.tr
                    key={appointmentId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-slate-100 text-slate-700"
                  >
                    <td className="px-3 py-2">
                      {first(row.timeSlot)} <span className="text-xs text-slate-500">({formatDate(row.appointmentDate)})</span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-900">
                        {`${first(row?.patient?.firstName, "")} ${first(row?.patient?.lastName, "")}`.trim() || first(row?.patient?.name)}
                      </p>
                      <p className="text-xs text-slate-500">{first(row?.patient?.patientId)}</p>
                    </td>
                    <td className="px-3 py-2">{first(row?.physiotherapist?.name)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={first(row.status, "PENDING")} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateStatus(appointmentId, "ARRIVED")}
                          disabled={saving === `${appointmentId}-ARRIVED`}
                          className="rounded-lg border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700"
                        >
                          Mark Arrived
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/nurse/intake?appointmentId=${encodeURIComponent(appointmentId)}&patientId=${encodeURIComponent(first(row?.patient?.patientId || row?.patient?._id, ""))}`)}
                          className="rounded-lg border border-cyan-300 px-2 py-1 text-xs font-semibold text-cyan-700"
                        >
                          Open Intake
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/nurse/check-in?patientId=${encodeURIComponent(first(row?.patient?.patientId || row?.patient?._id, ""))}&appointmentId=${encodeURIComponent(appointmentId)}`)}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
                        >
                          View Profile
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {!loading && !rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No appointments match selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}
