import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle, Activity, FilePlus2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import { consultantApiExamples } from "../../services/api.examples";

const glass = "bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20";
const inputClass = "rounded-xl border border-slate-200 bg-white/85 p-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200";
const list = (res) => (Array.isArray(res?.data?.data) ? res.data.data : []);

export default function ConsultantDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      try {
        const appRes = await consultantApiExamples.getAppointments(user?.id || user?.userId);
        const appRows = list(appRes);
        setAppointments(appRows);

        const firstPatientId = appRows[0]?.patient?._id || appRows[0]?.patientId;
        if (firstPatientId) {
          const vRes = await consultantApiExamples.getPatientVitals(firstPatientId);
          setVitals(list(vRes));
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load consultant dashboard.");
      }
    };

    if (user) {
      load();
      const interval = setInterval(load, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const completed = useMemo(
    () => appointments.filter((item) => String(item?.status || "").toUpperCase() === "COMPLETED").length,
    [appointments]
  );

  const filteredAppointments = useMemo(() => {
    if (statusFilter === "ALL") return appointments;
    return appointments.filter((item) => String(item?.status || "").toUpperCase() === statusFilter);
  }, [appointments, statusFilter]);

  const saveConsultation = async () => {
    const patientId = appointments[0]?.patient?._id || appointments[0]?.patientId;
    if (!patientId || !note.trim()) return;
    try {
      await consultantApiExamples.addConsultation({ patientId, notes: note });
      setNote("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add consultation note.");
    }
  };

  return (
    <DashboardLayout title="Consultant Dashboard">
      <section className="grid gap-6 md:grid-cols-4">
        <div className={`${glass} p-6`}>
          <CalendarClock className="mb-3 text-cyan-700" size={20} />
          <p className="text-sm text-slate-600">Upcoming Appointments</p>
          <p className="mt-2 text-3xl font-semibold">{appointments.length}</p>
        </div>
        <div className={`${glass} p-6`}>
          <CheckCircle className="mb-3 text-cyan-700" size={20} />
          <p className="text-sm text-slate-600">Completed Appointments</p>
          <p className="mt-2 text-3xl font-semibold">{completed}</p>
        </div>
        <div className={`${glass} p-6`}>
          <Activity className="mb-3 text-cyan-700" size={20} />
          <p className="text-sm text-slate-600">Patient Vitals Available</p>
          <p className="mt-2 text-3xl font-semibold">{vitals.length}</p>
        </div>
        <div className={`${glass} p-6`}>
          <FilePlus2 className="mb-3 text-cyan-700" size={20} />
          <p className="text-sm text-slate-600">Consultation Notes</p>
          <p className="mt-2 text-3xl font-semibold">{note ? 1 : 0}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className={`${glass} p-6`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-tight">Upcoming Appointments</h3>
            <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="space-y-3">
            {filteredAppointments.slice(0, 8).map((item) => (
              <motion.div key={item._id || item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white/40 p-4 text-sm text-slate-700">
                <p className="font-semibold">{item?.patient?.name || item?.patient?.firstName || "Patient"}</p>
                <p>{new Date(item.appointmentDate || item.date || item.createdAt).toLocaleString()}</p>
                <p className="mt-1">Status: {item.status || "PENDING"}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className={`${glass} p-6`}>
          <h3 className="mb-4 text-lg font-semibold tracking-tight">Access Patient Vitals</h3>
          <div className="space-y-3">
            {vitals.slice(0, 6).map((item) => (
              <div key={item._id || item.id} className="rounded-xl bg-white/40 p-4 text-sm text-slate-700">
                <p>BP: {item.bloodPressure || "-"}</p>
                <p>Pulse: {item.pulse || "-"}</p>
                <p>Temp: {item.temperature || "-"}</p>
              </div>
            ))}
            {!vitals.length ? <p className="text-sm text-slate-500">No vitals available for selected patient.</p> : null}
          </div>
        </div>
      </section>

      <section className={`mt-8 ${glass} p-6`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight">Add Consultation Notes</h3>
        {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-200 bg-white/85 p-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
          placeholder="Clinical observations, diagnosis, and digital prescription notes..."
        />
        <button
          onClick={saveConsultation}
          className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
        >
          Save Consultation
        </button>
      </section>
    </DashboardLayout>
  );
}
