import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { first, formatDateTime, glassCardClass, inputClass, sectionMutedClass } from "./nurse.ui";

export default function PatientTimeline() {
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeline, setTimeline] = useState(null);

  const loadTimeline = async () => {
    if (!patientId) return;
    setLoading(true);
    setError("");
    try {
      const data = await nurseDashboardService.getPatientTimeline(patientId);
      setTimeline(data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to fetch patient timeline.");
      setTimeline(null);
    } finally {
      setLoading(false);
    }
  };

  const sessions = Array.isArray(timeline?.sessions) ? timeline.sessions : [];
  const vitals = Array.isArray(timeline?.vitals) ? timeline.vitals : [];
  const painHistory = Array.isArray(timeline?.painHistory) ? timeline.painHistory : [];
  const alerts = Array.isArray(timeline?.alerts) ? timeline.alerts : [];

  return (
    <DashboardLayout title="Patient Timeline">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className={`${glassCardClass} mb-8`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Search Timeline</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className={inputClass}
            placeholder="Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
          <button
            type="button"
            onClick={loadTimeline}
            disabled={!patientId || loading}
            className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Load Timeline"}
          </button>
        </div>
      </section>

      {timeline ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <div className={glassCardClass}>
            <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Past Sessions</h3>
            <div className="space-y-3">
              {sessions.map((row) => (
                <motion.div key={row._id || row.appointmentId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white/35 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{formatDateTime(row.appointmentDate)}</p>
                  <p>PT: {first(row?.physiotherapist?.name)}</p>
                  <p>Status: <StatusBadge status={first(row.status)} /></p>
                </motion.div>
              ))}
              {!sessions.length ? <p className={sectionMutedClass}>No past sessions.</p> : null}
            </div>
          </div>

          <div className={glassCardClass}>
            <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Previous Vitals</h3>
            <div className="space-y-3">
              {vitals.map((row) => (
                <div key={row._id || row.id} className="rounded-xl bg-white/35 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{formatDateTime(row.recordedAt || row.createdAt)}</p>
                  <p>BP: {first(row.bloodPressure)} | Pulse: {first(row.pulse)} | Temp: {first(row.temperature)}</p>
                  <p>Nurse: {first(row?.recordedBy?.name)} ({first(row?.recordedBy?.nurseId || row?.recordedBy?.userId)})</p>
                </div>
              ))}
              {!vitals.length ? <p className={sectionMutedClass}>No vitals records.</p> : null}
            </div>
          </div>

          <div className={glassCardClass}>
            <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Pain History</h3>
            <div className="space-y-3">
              {painHistory.map((row) => (
                <div key={row.vitalsId || row._id} className="rounded-xl bg-white/35 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{formatDateTime(row.recordedAt)}</p>
                  <p>Pain Scale: {first(row.painScale, 0)}/10</p>
                  <p>Affected Area: {first(row.affectedArea)}</p>
                </div>
              ))}
              {!painHistory.length ? <p className={sectionMutedClass}>No pain history.</p> : null}
            </div>
          </div>

          <div className={glassCardClass}>
            <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Alerts</h3>
            <div className="space-y-3">
              {alerts.map((row) => (
                <div key={row._id || row.id} className="rounded-xl bg-white/35 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{first(row.type)}</p>
                  <p>{first(row.message)}</p>
                  <p className="mt-1">
                    <StatusBadge status={first(row.severity, "MEDIUM")} />
                  </p>
                </div>
              ))}
              {!alerts.length ? <p className={sectionMutedClass}>No active alerts.</p> : null}
            </div>
          </div>
        </section>
      ) : (
        <section className={glassCardClass}>
          <p className={sectionMutedClass}>Search a patient to view timeline. Nurse access is read-only for diagnosis and treatment plans.</p>
        </section>
      )}
    </DashboardLayout>
  );
}
