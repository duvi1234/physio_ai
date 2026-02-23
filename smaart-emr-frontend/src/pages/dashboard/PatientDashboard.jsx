import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Upload, Activity, BookOpen } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import { patientApiExamples, adminApiExamples } from "../../services/api.examples";

const glass = "bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20";
const inputClass = "rounded-xl border border-slate-200 bg-white/85 p-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200";
const toArray = (res) => (Array.isArray(res?.data?.data) ? res.data.data : []);
const timeSlots = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00"
];

const emptyBooking = {
  physiotherapistId: "",
  appointmentDate: "",
  timeSlot: "09:00 - 10:00",
  location: "Main Clinic",
  appointmentType: "WALK_IN"
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [recordFile, setRecordFile] = useState(null);
  const [bookingForm, setBookingForm] = useState(emptyBooking);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [appRes, vitalsRes, consultantRes] = await Promise.all([
        patientApiExamples.getAppointments(user?.id || user?.userId),
        patientApiExamples.getVitals(),
        adminApiExamples.getConsultants()
      ]);

      setAppointments(toArray(appRes));
      setVitals(toArray(vitalsRes));
      setConsultants(toArray(consultantRes));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load patient dashboard.");
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const bookAppointment = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await patientApiExamples.createAppointment(bookingForm);
      setBookingForm(emptyBooking);
      setMessage("Appointment booked successfully.");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Appointment booking failed.");
    }
  };

  const uploadRecord = async () => {
    if (!recordFile) return;
    const formData = new FormData();
    formData.append("file", recordFile);
    formData.append("title", "Patient Upload");
    formData.append("category", "OTHER");

    setError("");
    setMessage("");
    try {
      await patientApiExamples.uploadMedicalRecord(formData);
      setRecordFile(null);
      setMessage("Medical record uploaded successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Medical record upload failed.");
    }
  };

  return (
    <DashboardLayout title="Patient Dashboard">
      <section className="grid gap-6 md:grid-cols-4">
        <div className={`${glass} p-6`}>
          <CalendarCheck className="mb-3 text-cyan-700" size={20} />
          <p className="text-sm text-slate-600">My Appointments</p>
          <p className="mt-2 text-3xl font-semibold">{appointments.length}</p>
        </div>
        <div className={`${glass} p-6`}>
          <Upload className="mb-3 text-cyan-700" size={20} />
          <p className="text-sm text-slate-600">Medical Upload Ready</p>
          <p className="mt-2 text-3xl font-semibold">{recordFile ? 1 : 0}</p>
        </div>
        <div className={`${glass} p-6`}>
          <Activity className="mb-3 text-cyan-700" size={20} />
          <p className="text-sm text-slate-600">Recent Vitals</p>
          <p className="mt-2 text-3xl font-semibold">{vitals.length}</p>
        </div>
        <div className={`${glass} p-6`}>
          <BookOpen className="mb-3 text-cyan-700" size={20} />
          <p className="text-sm text-slate-600">Book Appointment</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">Available</p>
        </div>
      </section>

      <section className={`mt-8 ${glass} p-6`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight">Book Appointment</h3>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={bookAppointment}>
          <select className={inputClass} value={bookingForm.physiotherapistId} onChange={(e) => setBookingForm((p) => ({ ...p, physiotherapistId: e.target.value }))} required>
            <option value="">Select Consultant</option>
            {consultants.map((c) => <option key={c._id || c.id} value={c._id || c.userId}>{c.name || c.userId}</option>)}
          </select>
          <input type="date" className={inputClass} value={bookingForm.appointmentDate} onChange={(e) => setBookingForm((p) => ({ ...p, appointmentDate: e.target.value }))} required />
          <select className={inputClass} value={bookingForm.timeSlot} onChange={(e) => setBookingForm((p) => ({ ...p, timeSlot: e.target.value }))} required>
            {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </select>
          <input className={inputClass} placeholder="Location" value={bookingForm.location} onChange={(e) => setBookingForm((p) => ({ ...p, location: e.target.value }))} />
          <select className={inputClass} value={bookingForm.appointmentType} onChange={(e) => setBookingForm((p) => ({ ...p, appointmentType: e.target.value }))}>
            <option value="WALK_IN">Walk-In</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
          <button className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 md:col-span-2">
            Book Appointment
          </button>
        </form>
      </section>

      <section className={`mt-8 ${glass} p-6`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight">My Appointments</h3>
        <div className="space-y-3">
          {appointments.slice(0, 8).map((item) => (
            <motion.div key={item._id || item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white/40 p-4 text-sm text-slate-700">
              <p className="font-semibold">{new Date(item.appointmentDate || item.date || item.createdAt).toLocaleString()}</p>
              <p>Consultant: {item?.consultant?.name || item?.physiotherapist?.name || "TBD"}</p>
              <p>Status: {item?.status || "PENDING"}</p>
            </motion.div>
          ))}
          {!appointments.length ? <p className="text-sm text-slate-500">No appointments available.</p> : null}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className={`${glass} p-6`}>
          <h3 className="mb-4 text-lg font-semibold tracking-tight">View Vitals</h3>
          <div className="space-y-3">
            {vitals.slice(0, 8).map((item) => (
              <div key={item._id || item.id} className="rounded-xl bg-white/40 p-4 text-sm text-slate-700">
                <p>Blood Pressure: {item.bloodPressure || "-"}</p>
                <p>Pulse: {item.pulse || "-"}</p>
                <p>Temperature: {item.temperature || "-"}</p>
                <p>Recorded: {new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!vitals.length ? <p className="text-sm text-slate-500">No vitals records yet.</p> : null}
          </div>
        </div>

        <div className={`${glass} p-6`}>
          <h3 className="mb-4 text-lg font-semibold tracking-tight">Upload Medical Records</h3>
          {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="mb-3 text-sm text-emerald-700">{message}</p> : null}
          <input
            type="file"
            onChange={(e) => setRecordFile(e.target.files?.[0] || null)}
            className="w-full rounded-xl border border-slate-200 bg-white/85 p-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
          />
          <button
            onClick={uploadRecord}
            className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
          >
            Upload Record
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}
