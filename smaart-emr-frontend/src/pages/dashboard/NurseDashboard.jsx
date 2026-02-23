import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, HeartPulse, ClipboardCheck } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import { nurseApiExamples } from "../../services/api.examples";

const glass = "bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20";
const inputClass = "rounded-xl border border-slate-200 bg-white/85 p-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200";
const asArray = (res) => (Array.isArray(res?.data?.data) ? res.data.data : []);

const emptyVitals = {
  patientId: "",
  height: "",
  weight: "",
  bloodPressure: "",
  pulse: "",
  temperature: "",
  oxygenSaturation: "",
  pastMedicalHistory: "",
  allergies: "",
  currentMedications: "",
  lifestyleFactors: ""
};

export default function NurseDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [recentVitals, setRecentVitals] = useState([]);
  const [vitalsForm, setVitalsForm] = useState(emptyVitals);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const appointmentRes = await nurseApiExamples.getAssignedAppointments(user?.id || user?.userId);
      const appointmentRows = asArray(appointmentRes);
      setAppointments(appointmentRows);

      const firstPatientId = appointmentRows[0]?.patient?.patientId || appointmentRows[0]?.patient?._id;
      if (firstPatientId) {
        const vitalsRes = await nurseApiExamples.getVitals(firstPatientId);
        setRecentVitals(asArray(vitalsRes));
        setVitalsForm((v) => ({ ...v, patientId: firstPatientId }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load nurse dashboard.");
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const submitVitals = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await nurseApiExamples.recordVitals({
        ...vitalsForm,
        height: vitalsForm.height ? Number(vitalsForm.height) : undefined,
        weight: vitalsForm.weight ? Number(vitalsForm.weight) : undefined,
        pulse: vitalsForm.pulse ? Number(vitalsForm.pulse) : undefined,
        temperature: vitalsForm.temperature ? Number(vitalsForm.temperature) : undefined,
        oxygenSaturation: vitalsForm.oxygenSaturation ? Number(vitalsForm.oxygenSaturation) : undefined,
        allergies: vitalsForm.allergies ? vitalsForm.allergies.split(",").map((x) => x.trim()).filter(Boolean) : []
      });
      setMessage("Vitals submitted and synced to EMR.");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Vitals submission failed.");
    }
  };

  const inputType = (key) => {
    if (["height", "weight", "pulse", "temperature", "oxygenSaturation"].includes(key)) return "number";
    return "text";
  };

  return (
    <DashboardLayout title="Nurse Dashboard">
      <section className="grid gap-6 md:grid-cols-3">
        <div className={`${glass} p-6`}>
          <CalendarClock className="mb-3 text-cyan-700" size={20} />
          <p className="text-sm text-slate-600">Today's Assigned Appointments</p>
          <p className="mt-2 text-3xl font-semibold">{appointments.length}</p>
        </div>
        <div className={`${glass} p-6`}>
          <HeartPulse className="mb-3 text-cyan-700" size={20} />
          <p className="text-sm text-slate-600">Recent Vitals Logged</p>
          <p className="mt-2 text-3xl font-semibold">{recentVitals.length}</p>
        </div>
        <div className={`${glass} p-6`}>
          <p className="text-sm text-slate-600">Logged In Nurse</p>
          <p className="mt-2 text-lg font-semibold">{user?.name || user?.userId || "Nurse"}</p>
        </div>
      </section>

      <section className={`mt-8 ${glass} p-6`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight">Vitals Entry</h3>
        {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="mb-3 text-sm text-emerald-700">{message}</p> : null}
        <form className="grid gap-3 md:grid-cols-2" onSubmit={submitVitals}>
          {[
            ["patientId", "Patient ID"],
            ["height", "Height (cm)"],
            ["weight", "Weight (kg)"],
            ["bloodPressure", "Blood Pressure"],
            ["pulse", "Pulse"],
            ["temperature", "Temperature"],
            ["oxygenSaturation", "SpO2"],
            ["pastMedicalHistory", "Past Medical History"],
            ["allergies", "Allergies (comma separated)"],
            ["currentMedications", "Current Medications"],
            ["lifestyleFactors", "Lifestyle Factors"]
          ].map(([key, label]) => (
            <input
              key={key}
              type={inputType(key)}
              placeholder={label}
              value={vitalsForm[key]}
              onChange={(e) => setVitalsForm((v) => ({ ...v, [key]: e.target.value }))}
              className={inputClass}
              required={["patientId", "bloodPressure", "pulse", "temperature"].includes(key)}
            />
          ))}
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 md:col-span-2">
            <ClipboardCheck size={16} /> Submit Vitals
          </button>
        </form>
      </section>

      <section className={`mt-8 ${glass} p-6`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight">Assigned Appointments</h3>
        <div className="space-y-3">
          {appointments.slice(0, 8).map((row) => (
            <motion.div key={row._id || row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white/40 p-4 text-sm text-slate-700">
              <p className="font-semibold">{row?.patient?.name || `${row?.patient?.firstName || ""} ${row?.patient?.lastName || ""}`.trim()}</p>
              <p>{new Date(row.appointmentDate || row.date || row.createdAt).toLocaleString()}</p>
              <p>Status: {row.status || "CONFIRMED"}</p>
            </motion.div>
          ))}
          {!appointments.length ? <p className="text-sm text-slate-500">No appointments assigned.</p> : null}
        </div>
      </section>
    </DashboardLayout>
  );
}
