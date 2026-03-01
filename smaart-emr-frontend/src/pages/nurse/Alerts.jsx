import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { first, formatDateTime, glassCardClass, inputClass, textareaClass, todayIso } from "./nurse.ui";

const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const emptyForm = {
  patientId: "",
  appointmentId: "",
  type: "Manual Alert",
  severity: "MEDIUM",
  message: ""
};

export default function Alerts() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const loadAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await nurseDashboardService.getTodayAlerts();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load today's alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const createAlert = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await nurseDashboardService.createAlert({
        ...form,
        source: "MANUAL"
      });
      setForm(emptyForm);
      setMessage("Manual flag added and sent to PT.");
      await loadAlerts();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create alert.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Alerts & Flags">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className={`${glassCardClass} mb-8`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Add Manual Flag</h3>
        <form onSubmit={createAlert} className="grid gap-3 md:grid-cols-2">
          <input className={inputClass} placeholder="Patient ID" value={form.patientId} onChange={(e) => setForm((prev) => ({ ...prev, patientId: e.target.value }))} required />
          <input className={inputClass} placeholder="Appointment ID (optional)" value={form.appointmentId} onChange={(e) => setForm((prev) => ({ ...prev, appointmentId: e.target.value }))} />
          <input className={inputClass} placeholder="Flag Type" value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} />
          <select className={inputClass} value={form.severity} onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}>
            {severities.map((row) => (
              <option key={row} value={row}>
                {row}
              </option>
            ))}
          </select>
          <textarea className={`${textareaClass} md:col-span-2`} rows={3} placeholder="Alert message to notify PT..." value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} required />
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60 md:col-span-2"
          >
            {saving ? "Saving..." : "Add Flag & Notify PT"}
          </button>
        </form>
      </section>

      <section className={glassCardClass}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Today's Alerts ({todayIso()})</h3>
          <button type="button" onClick={loadAlerts} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">
            Refresh
          </button>
        </div>
        {loading ? <p className="text-sm text-slate-600">Loading alerts...</p> : null}
        <div className="space-y-3">
          {rows.map((row) => (
            <motion.div key={row._id || row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white/35 p-4 text-sm text-slate-700">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{first(row.type)}</p>
                <StatusBadge status={first(row.severity, "MEDIUM")} />
              </div>
              <p>{first(row.message)}</p>
              <p className="mt-2 text-xs text-slate-500">
                Patient: {first(row?.patient?.patientId)} | Source: {first(row.source)} | {formatDateTime(row.createdAt)}
              </p>
            </motion.div>
          ))}
          {!loading && !rows.length ? <p className="text-sm text-slate-600">No alerts generated for today.</p> : null}
        </div>
      </section>
    </DashboardLayout>
  );
}
