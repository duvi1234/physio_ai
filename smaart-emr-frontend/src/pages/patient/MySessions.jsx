import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarClock, Download, Stethoscope } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Modal from "../../components/ui/Modal";
import patientDashboardService from "../../services/patient.dashboard.service";
import {
  buildSummaryDocument,
  cardTitleClass,
  first,
  formatDate,
  formatDateTime,
  glassCardClass,
  inputClass,
  sectionMutedClass,
  statusBadgeClass
} from "./patient.ui";

const timeSlots = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM"
];

const emptyForm = {
  physiotherapistId: "",
  appointmentDate: "",
  timeSlot: timeSlots[0],
  location: "Main Clinic",
  appointmentType: "WALK_IN"
};

export default function MySessions() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [painRows, setPainRows] = useState([]);
  const [postureRows, setPostureRows] = useState([]);
  const [plan, setPlan] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [bookingForm, setBookingForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const identity = patientDashboardService.getPatientIdentity();
      const patientRef = identity.patientId || identity.mongoId;
      const [sessionRows, consultantRows, vitalRows, painData, postureData, planData] = await Promise.all([
        patientDashboardService.getSessions(patientRef),
        patientDashboardService.getConsultants(),
        patientDashboardService.getVitalsHistory(patientRef),
        patientDashboardService.getPainAssessments(patientRef),
        patientDashboardService.getPosturalAssessments(patientRef),
        patientDashboardService.getTreatmentPlan(patientRef)
      ]);
      setSessions(Array.isArray(sessionRows) ? sessionRows : []);
      setConsultants(Array.isArray(consultantRows) ? consultantRows : []);
      setVitals(Array.isArray(vitalRows) ? vitalRows : []);
      setPainRows(Array.isArray(painData) ? painData : []);
      setPostureRows(Array.isArray(postureData) ? postureData : []);
      setPlan(planData || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load session details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("mode") === "book") {
      setMessage("Complete the booking form to schedule your next session.");
    }
  }, [location.search]);

  const [upcoming, past] = useMemo(() => {
    const now = Date.now();
    const nextRows = [];
    const previousRows = [];
    sessions.forEach((row) => {
      const time = new Date(row.sessionDate || row.appointmentDate || row.createdAt).getTime();
      if (time >= now) nextRows.push(row);
      else previousRows.push(row);
    });
    nextRows.sort(
      (a, b) =>
        new Date(a.sessionDate || a.appointmentDate || a.createdAt).getTime() -
        new Date(b.sessionDate || b.appointmentDate || b.createdAt).getTime()
    );
    previousRows.sort(
      (a, b) =>
        new Date(b.sessionDate || b.appointmentDate || b.createdAt).getTime() -
        new Date(a.sessionDate || a.appointmentDate || a.createdAt).getTime()
    );
    return [nextRows, previousRows];
  }, [sessions]);

  const createSession = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await patientDashboardService.createAppointment(bookingForm);
      setBookingForm(emptyForm);
      setMessage("Appointment booked successfully.");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Appointment booking failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const openSummaryPdf = () => {
    if (!selectedSession) return;
    const latestVitals = vitals[0] || {};
    const latestPain = painRows[0] || {};
    const latestPosture = postureRows[0] || {};
    const exercises = Array.isArray(plan?.exercises) ? plan.exercises : [];

    const html = buildSummaryDocument({
      title: `Consultation Summary - ${first(selectedSession?.appointmentId || selectedSession?.id)}`,
      sections: [
        {
          title: "Session Information",
          content: `
            <p><b>Date:</b> ${formatDateTime(selectedSession?.sessionDate || selectedSession?.appointmentDate)}</p>
            <p><b>Physiotherapist:</b> ${first(
              selectedSession?.physiotherapist?.name || selectedSession?.consultant?.name
            )}</p>
            <p><b>Status:</b> ${first(selectedSession?.sessionStatus || selectedSession?.status)}</p>
          `
        },
        {
          title: "Vitals",
          content: `
            <p><b>BP:</b> ${first(latestVitals.bloodPressure)}</p>
            <p><b>Pulse:</b> ${first(latestVitals.pulse)}</p>
            <p><b>Temperature:</b> ${first(latestVitals.temperature)}</p>
          `
        },
        {
          title: "Pain & Posture",
          content: `
            <p><b>Pain Score:</b> ${first(latestPain.painIntensity || latestPain.painScore, "0")}/10</p>
            <p><b>Pain Type:</b> ${first(latestPain.painType)}</p>
            <p><b>Posture Score:</b> ${first(latestPosture.alignmentScore || latestPosture.score)}</p>
          `
        },
        {
          title: "Exercise Plan",
          content: exercises
            .slice(0, 6)
            .map(
              (row) =>
                `<p><b>${row.name}</b> - ${first(row.sets, 0)} sets x ${first(row.reps, 0)} reps (${first(
                  row.frequency
                )})</p>`
            )
            .join("")
        },
        {
          title: "Physiotherapist Notes",
          content: `<p>${first(selectedSession?.consultation?.notes || selectedSession?.consultationNotes)}</p>`
        }
      ]
    });

    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <DashboardLayout title="My Sessions">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className={`${glassCardClass} mb-8`}>
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock size={18} className="text-cyan-700" />
          <h3 className={cardTitleClass}>Book Appointment</h3>
        </div>
        <form onSubmit={createSession} className="grid gap-3 md:grid-cols-2">
          <select
            className={inputClass}
            value={bookingForm.physiotherapistId}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, physiotherapistId: e.target.value }))}
            required
          >
            <option value="">Select Physiotherapist</option>
            {consultants.map((row) => (
              <option key={row._id || row.userId || row.physioId} value={row._id || row.userId || row.physioId}>
                {first(row.name)} ({first(row.physioId || row.userId)})
              </option>
            ))}
          </select>
          <input
            type="date"
            className={inputClass}
            value={bookingForm.appointmentDate}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, appointmentDate: e.target.value }))}
            required
          />
          <select
            className={inputClass}
            value={bookingForm.timeSlot}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, timeSlot: e.target.value }))}
          >
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            value={bookingForm.location}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Session Location"
          />
          <select
            className={inputClass}
            value={bookingForm.appointmentType}
            onChange={(e) => setBookingForm((prev) => ({ ...prev, appointmentType: e.target.value }))}
          >
            <option value="WALK_IN">Walk-In</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60 md:col-span-2"
          >
            {submitting ? "Booking..." : "Book Session"}
          </button>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={glassCardClass}>
          <h3 className={cardTitleClass}>Upcoming Sessions</h3>
          <div className="mt-4 space-y-3">
            {loading ? <p className={sectionMutedClass}>Loading upcoming sessions...</p> : null}
            {!loading && !upcoming.length ? <p className={sectionMutedClass}>No upcoming sessions.</p> : null}
            {upcoming.map((row) => (
              <motion.button
                key={row.id || row._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                type="button"
                onClick={() => setSelectedSession(row)}
                className="w-full rounded-xl border border-white/30 bg-white/35 p-4 text-left transition-all duration-300 hover:scale-[1.01]"
              >
                <p className="font-semibold text-slate-900">
                  {formatDateTime(row.sessionDate || row.appointmentDate || row.createdAt)}
                </p>
                <p className="text-sm text-slate-700">
                  {first(row?.physiotherapist?.name || row?.consultant?.name)} | {first(row.timeSlot)}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(
                    row.sessionStatus || row.status
                  )}`}
                >
                  {first(row.sessionStatus || row.status)}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className={glassCardClass}>
          <h3 className={cardTitleClass}>Past Sessions</h3>
          <div className="mt-4 space-y-3">
            {loading ? <p className={sectionMutedClass}>Loading session history...</p> : null}
            {!loading && !past.length ? <p className={sectionMutedClass}>No past sessions yet.</p> : null}
            {past.map((row) => (
              <motion.button
                key={row.id || row._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                type="button"
                onClick={() => setSelectedSession(row)}
                className="w-full rounded-xl border border-white/30 bg-white/35 p-4 text-left transition-all duration-300 hover:scale-[1.01]"
              >
                <p className="font-semibold text-slate-900">
                  {formatDateTime(row.sessionDate || row.appointmentDate || row.createdAt)}
                </p>
                <p className="text-sm text-slate-700">
                  {first(row?.physiotherapist?.name || row?.consultant?.name)} | {first(row.timeSlot)}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(
                    row.sessionStatus || row.status
                  )}`}
                >
                  {first(row.sessionStatus || row.status)}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <Modal
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        panelClassName="w-[95vw] max-w-5xl"
        showDefaultClose={false}
      >
        <div className="w-full max-w-4xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Session Clinical Summary</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                onClick={openSummaryPdf}
              >
                <Download size={14} />
                Download Summary
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                onClick={() => setSelectedSession(null)}
              >
                Close
              </button>
            </div>
          </div>
          {selectedSession ? (
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold text-slate-500">SESSION DETAILS</p>
                <p>Date: {formatDateTime(selectedSession.sessionDate || selectedSession.appointmentDate)}</p>
                <p>Time: {first(selectedSession.timeSlot)}</p>
                <p>Physiotherapist: {first(selectedSession?.physiotherapist?.name || selectedSession?.consultant?.name)}</p>
                <p>Location: {first(selectedSession.location)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold text-slate-500">NURSE VITALS</p>
                <p>BP: {first(vitals[0]?.bloodPressure)}</p>
                <p>Pulse: {first(vitals[0]?.pulse)}</p>
                <p>Temperature: {first(vitals[0]?.temperature)}</p>
                <p>SpO2: {first(vitals[0]?.oxygenSaturation)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                <p className="mb-1 text-xs font-semibold text-slate-500">PT NOTES</p>
                <p>{first(selectedSession?.consultation?.notes || selectedSession?.consultationNotes)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold text-slate-500">PAIN SUMMARY</p>
                <p>Latest Score: {first(painRows[0]?.painIntensity || painRows[0]?.painScore, "0")}/10</p>
                <p>Type: {first(painRows[0]?.painType)}</p>
                <p>Area: {first(painRows[0]?.bodyArea)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold text-slate-500">POSTURAL ASSESSMENT</p>
                <p>Alignment Score: {first(postureRows[0]?.alignmentScore || postureRows[0]?.score)}</p>
                <p>Improvement: {first(postureRows[0]?.improvementPercent || postureRows[0]?.improvement)}%</p>
                <p>Comments: {first(postureRows[0]?.comments || postureRows[0]?.remarks)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                <p className="mb-1 text-xs font-semibold text-slate-500">EXERCISE PLAN</p>
                <div className="space-y-1">
                  {(Array.isArray(plan?.exercises) ? plan.exercises : []).slice(0, 6).map((row) => (
                    <p key={row.id || row._id}>
                      <Stethoscope size={12} className="mr-1 inline text-cyan-700" />
                      {row.name}: {first(row.sets, 0)} sets x {first(row.reps, 0)} reps ({first(row.frequency)})
                    </p>
                  ))}
                  {!Array.isArray(plan?.exercises) || !plan.exercises.length ? <p>No linked exercise plan.</p> : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
