import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import DashboardLayout from "../../layouts/DashboardLayout";
import patientDashboardService from "../../services/patient.dashboard.service";
import { cardTitleClass, first, formatDate, formatDateTime, glassCardClass, sectionMutedClass } from "./patient.ui";

const parseBP = (bp) => {
  const text = String(bp || "");
  const match = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return { systolic: null, diastolic: null };
  return { systolic: Number(match[1]), diastolic: Number(match[2]) };
};

export default function VitalsHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const identity = patientDashboardService.getPatientIdentity();
        const patientRef = identity.patientId || identity.mongoId;
        const data = await patientDashboardService.getVitalsHistory(patientRef);
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load vitals.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartRows = useMemo(
    () =>
      [...rows]
        .sort((a, b) => new Date(a.recordedAt || a.createdAt).getTime() - new Date(b.recordedAt || b.createdAt).getTime())
        .slice(-14)
        .map((row) => {
          const bp = parseBP(row.bloodPressure);
          return {
            date: formatDate(row.recordedAt || row.createdAt),
            weight: Number(row.weight || 0),
            systolic: bp.systolic,
            diastolic: bp.diastolic
          };
        }),
    [rows]
  );

  const latest = rows[0] || {};

  return (
    <DashboardLayout title="Vitals & Medical History">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Height", value: `${first(latest.height, "-")} cm` },
          { label: "Weight", value: `${first(latest.weight, "-")} kg` },
          { label: "BMI", value: first(latest.bmi, "-") },
          { label: "Blood Pressure", value: first(latest.bloodPressure) },
          { label: "Pulse", value: first(latest.pulse) },
          { label: "Temp", value: first(latest.temperature) },
          { label: "SpO2", value: first(latest.oxygenSaturation) },
          { label: "Last Recorded", value: formatDateTime(latest.recordedAt || latest.createdAt) }
        ].map((item) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={glassCardClass}>
            <p className="text-xs uppercase text-slate-500">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
          </motion.div>
        ))}
      </section>

      <section className={`${glassCardClass} mt-8`}>
        <h3 className={cardTitleClass}>Medical History Notes</h3>
        {loading ? <p className={`${sectionMutedClass} mt-3`}>Loading vitals history...</p> : null}
        {!loading ? (
          <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <p>
              <span className="font-semibold">Allergies:</span>{" "}
              {Array.isArray(latest.allergies) ? latest.allergies.join(", ") || "-" : first(latest.allergies)}
            </p>
            <p>
              <span className="font-semibold">Current Medications:</span> {first(latest.currentMedications)}
            </p>
            <p className="md:col-span-2">
              <span className="font-semibold">Past Medical History:</span> {first(latest.pastMedicalHistory)}
            </p>
            <p className="md:col-span-2">
              <span className="font-semibold">Lifestyle Notes:</span> {first(latest.lifestyleFactors)}
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className={glassCardClass}>
          <h3 className={`${cardTitleClass} mb-3`}>Weight Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="date" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#0284c7" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={glassCardClass}>
          <h3 className={`${cardTitleClass} mb-3`}>BP Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="date" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="systolic" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diastolic" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className={`${glassCardClass} mt-8`}>
        <h3 className={cardTitleClass}>Vitals Timeline</h3>
        <div className="mt-4 space-y-3">
          {!loading && !rows.length ? <p className={sectionMutedClass}>No vitals records found.</p> : null}
          {rows.slice(0, 12).map((row) => (
            <div key={row._id || row.id} className="rounded-xl bg-white/35 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{formatDateTime(row.recordedAt || row.createdAt)}</p>
              <p>
                Height/Weight: {first(row.height, "-")} cm / {first(row.weight, "-")} kg
              </p>
              <p>
                BP/Pulse/Temp: {first(row.bloodPressure)} / {first(row.pulse)} / {first(row.temperature)}
              </p>
              <p>
                Nurse: {first(row?.recordedBy?.name)} ({first(row?.recordedBy?.nurseId || row?.recordedBy?.userId)})
              </p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
