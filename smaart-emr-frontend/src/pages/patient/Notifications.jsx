import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Trash2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import patientDashboardService from "../../services/patient.dashboard.service";
import { cardTitleClass, first, formatDateTime, glassCardClass, sectionMutedClass } from "./patient.ui";

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const patientRef =
    patientDashboardService.getPatientIdentity().patientId ||
    patientDashboardService.getPatientIdentity().mongoId ||
    "self";

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await patientDashboardService.getNotifications(patientRef);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const markRead = (id) => {
    const next = patientDashboardService.markNotificationRead(id, patientRef);
    setRows(next);
  };

  const removeNotification = (id) => {
    const next = patientDashboardService.deleteNotification(id, patientRef);
    setRows(next);
  };

  return (
    <DashboardLayout title="Notifications">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className={glassCardClass}>
        <div className="mb-4 flex items-center gap-2">
          <Bell size={18} className="text-cyan-700" />
          <h3 className={cardTitleClass}>Patient Notifications</h3>
        </div>
        {loading ? <p className={sectionMutedClass}>Loading notifications...</p> : null}
        {!loading && !rows.length ? <p className={sectionMutedClass}>No notifications available.</p> : null}
        <div className="space-y-3">
          {rows.map((row) => {
            const rowId = row._id || row.id;
            return (
              <motion.div
                key={rowId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-4 ${row.isRead ? "border-slate-200 bg-white/30" : "border-cyan-200 bg-cyan-50/60"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">{first(row.type, "Notification")}</p>
                    <p className="mt-1 text-slate-700">{first(row.message)}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDateTime(row.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!row.isRead ? (
                      <button
                        type="button"
                        onClick={() => markRead(rowId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700"
                      >
                        <Check size={13} />
                        Mark as Read
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeNotification(rowId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </DashboardLayout>
  );
}
