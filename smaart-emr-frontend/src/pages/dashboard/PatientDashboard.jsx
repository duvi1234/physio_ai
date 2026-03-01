import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, CalendarClock, ClipboardCheck, HeartPulse, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import patientDashboardService from "../../services/patient.dashboard.service";
import {
  calculatePercent,
  cardTitleClass,
  first,
  formatDate,
  formatDateTime,
  glassCardClass,
  greetingByHour,
  nowIstParts,
  sectionMutedClass,
  statusBadgeClass
} from "../patient/patient.ui";

const quickActionClass =
  "rounded-xl border border-white/30 bg-white/20 p-4 text-left shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/30";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [sessions, setSessions] = useState([]);
  const [painAssessments, setPainAssessments] = useState([]);
  const [plan, setPlan] = useState(null);
  const [postureRows, setPostureRows] = useState([]);
  const [nowIst, setNowIst] = useState(nowIstParts());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const identity = patientDashboardService.getPatientIdentity();
        const patientRef = identity.patientId || identity.mongoId;
        const [profileRow, sessionRows, painRows, planRow, postureData] = await Promise.all([
          patientDashboardService.getProfile(),
          patientDashboardService.getSessions(patientRef),
          patientDashboardService.getPainAssessments(patientRef),
          patientDashboardService.getTreatmentPlan(patientRef),
          patientDashboardService.getPosturalAssessments(patientRef)
        ]);
        if (!mounted) return;
        setProfile(profileRow || {});
        setSessions(Array.isArray(sessionRows) ? sessionRows : []);
        setPainAssessments(Array.isArray(painRows) ? painRows : []);
        setPlan(planRow || null);
        setPostureRows(Array.isArray(postureData) ? postureData : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Unable to load patient overview.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const timer = setInterval(() => setNowIst(nowIstParts()), 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const upcomingSession = useMemo(() => {
    const now = Date.now();
    return sessions
      .filter((row) => new Date(row.sessionDate || row.appointmentDate || row.date || row.createdAt).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.sessionDate || a.appointmentDate || a.date || a.createdAt).getTime() -
          new Date(b.sessionDate || b.appointmentDate || b.date || b.createdAt).getTime()
      )[0];
  }, [sessions]);

  const lastSession = useMemo(() => {
    const now = Date.now();
    return sessions
      .filter((row) => new Date(row.sessionDate || row.appointmentDate || row.date || row.createdAt).getTime() < now)
      .sort(
        (a, b) =>
          new Date(b.sessionDate || b.appointmentDate || b.date || b.createdAt).getTime() -
          new Date(a.sessionDate || a.appointmentDate || a.date || a.createdAt).getTime()
      )[0];
  }, [sessions]);

  const averagePain = useMemo(() => {
    if (!painAssessments.length) return 0;
    const values = painAssessments
      .map((row) => Number(row.painIntensity || row.painScore || 0))
      .filter((num) => Number.isFinite(num));
    if (!values.length) return 0;
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  }, [painAssessments]);

  const exerciseCompliance = useMemo(() => {
    const exercises = Array.isArray(plan?.exercises) ? plan.exercises : [];
    const completed = exercises.filter((row) => row.completed).length;
    return calculatePercent(completed, exercises.length);
  }, [plan]);

  const postureStatus = useMemo(() => {
    const latest = postureRows[0] || {};
    const score = Number(latest.alignmentScore || latest.score || 0);
    if (!score) return "Not Available";
    if (score >= 80) return "Good Alignment";
    if (score >= 60) return "Moderate Deviation";
    return "Needs Correction";
  }, [postureRows]);

  const patientName = `${first(profile?.firstName, "")} ${first(profile?.lastName, "")}`.trim() || first(profile?.name, "Patient");
  const patientId = first(profile?.patientId || patientDashboardService.getPatientIdentity().patientId, "");

  return (
    <DashboardLayout
      title="Patient Dashboard"
      headerAction={
        <button
          type="button"
          onClick={() => navigate("/dashboard/patient/profile")}
          className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
        >
          My Profile
        </button>
      }
    >
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${glassCardClass} mb-8`}>
        <p className={sectionMutedClass}>
          {greetingByHour(nowIst.hour24)} {patientName}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {patientId ? `${patientName} (${patientId})` : patientName}
        </h2>
        <p className="mt-1 text-sm font-medium text-cyan-700">Current IST: {nowIst.time}</p>
      </motion.section>

      {error ? (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={glassCardClass}>
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock size={18} className="text-cyan-700" />
            <h3 className={cardTitleClass}>Upcoming Session</h3>
          </div>
          {loading ? (
            <p className={sectionMutedClass}>Loading next session...</p>
          ) : upcomingSession ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Date:</span> {formatDate(upcomingSession.sessionDate || upcomingSession.appointmentDate)}
              </p>
              <p>
                <span className="font-semibold">Time:</span> {first(upcomingSession.timeSlot)}
              </p>
              <p>
                <span className="font-semibold">Physiotherapist:</span>{" "}
                {first(upcomingSession?.physiotherapist?.name || upcomingSession?.consultant?.name || upcomingSession?.consultantName)}
              </p>
              <p>
                <span className="font-semibold">Location:</span> {first(upcomingSession.location)}
              </p>
              <p>
                <span className="font-semibold">Type:</span> {String(first(upcomingSession.appointmentType)).replace("_", "-")}
              </p>
              <span
                className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(
                  upcomingSession.sessionStatus || upcomingSession.status
                )}`}
              >
                {first(upcomingSession.sessionStatus || upcomingSession.status)}
              </span>
            </div>
          ) : (
            <p className={sectionMutedClass}>No upcoming session. Use quick action to book your next appointment.</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={glassCardClass}>
          <div className="mb-4 flex items-center gap-2">
            <HeartPulse size={18} className="text-cyan-700" />
            <h3 className={cardTitleClass}>Recovery Snapshot</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
            <div className="rounded-xl bg-white/35 p-3">
              <p className="text-xs uppercase text-slate-500">Latest Pain Score</p>
              <p className="text-lg font-semibold text-slate-900">{averagePain || 0}/10</p>
            </div>
            <div className="rounded-xl bg-white/35 p-3">
              <p className="text-xs uppercase text-slate-500">Last Session Date</p>
              <p className="text-lg font-semibold text-slate-900">
                {lastSession ? formatDate(lastSession.sessionDate || lastSession.appointmentDate) : "-"}
              </p>
            </div>
            <div className="rounded-xl bg-white/35 p-3">
              <p className="text-xs uppercase text-slate-500">Active Treatment Plan</p>
              <p className="text-base font-semibold text-slate-900">{first(plan?.name || plan?.diagnosis, "Not Available")}</p>
            </div>
            <div className="rounded-xl bg-white/35 p-3">
              <p className="text-xs uppercase text-slate-500">Exercise Compliance</p>
              <p className="text-lg font-semibold text-slate-900">{exerciseCompliance}%</p>
            </div>
            <div className="rounded-xl bg-white/35 p-3 sm:col-span-2">
              <p className="text-xs uppercase text-slate-500">Posture Status</p>
              <p className="text-base font-semibold text-slate-900">{postureStatus}</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mt-8">
        <h3 className={`${cardTitleClass} mb-4`}>Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <button type="button" className={quickActionClass} onClick={() => navigate("/dashboard/patient/sessions?mode=book")}>
            <CalendarClock size={18} className="mb-2 text-cyan-700" />
            <p className="font-semibold text-slate-900">Book Appointment</p>
            <p className="text-xs text-slate-600">Schedule walk-in or virtual session</p>
          </button>
          <button type="button" className={quickActionClass} onClick={() => navigate("/dashboard/patient/pain-assessment")}>
            <Activity size={18} className="mb-2 text-cyan-700" />
            <p className="font-semibold text-slate-900">Start Pain Assessment</p>
            <p className="text-xs text-slate-600">Record pain intensity and body area</p>
          </button>
          <button type="button" className={quickActionClass} onClick={() => navigate("/dashboard/patient/treatment-plan")}>
            <ClipboardCheck size={18} className="mb-2 text-cyan-700" />
            <p className="font-semibold text-slate-900">View Exercise Plan</p>
            <p className="text-xs text-slate-600">Track completion and rehab goals</p>
          </button>
          <button type="button" className={quickActionClass} onClick={() => navigate("/dashboard/patient/medical-records")}>
            <UploadCloud size={18} className="mb-2 text-cyan-700" />
            <p className="font-semibold text-slate-900">Upload Records</p>
            <p className="text-xs text-slate-600">MRI, X-ray, reports and prescriptions</p>
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className={glassCardClass}>
          <h3 className={cardTitleClass}>Recent Appointments</h3>
          <div className="mt-3 space-y-3">
            {sessions.slice(0, 5).map((row) => (
              <div key={row.id || row._id} className="rounded-xl bg-white/35 p-3 text-sm text-slate-700">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-slate-900">{formatDateTime(row.sessionDate || row.appointmentDate || row.createdAt)}</p>
                  <span className="inline-block rounded-lg bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-700">
                    {first(row.appointmentId, 'N/A')}
                  </span>
                </div>
                <p>Physiotherapist: {first(row?.physiotherapist?.name || row?.consultant?.name)}</p>
                <p>Type: {first(String(row?.appointmentType || "").replace("_", "-"))}</p>
                <p className="text-xs text-slate-600 mt-1">Status: {first(row.status, 'PENDING')}</p>
              </div>
            ))}
            {!sessions.length ? <p className={sectionMutedClass}>No sessions found.</p> : null}
          </div>
        </div>
        <div className={glassCardClass}>
          <h3 className={cardTitleClass}>Care Timeline</h3>
          <div className="mt-4 space-y-3 text-sm">
            {[
              "Appointment Confirmed",
              "Nurse Vitals Entry",
              "Physio Assessment",
              "Treatment Plan Active",
              "Summary & Follow-up"
            ].map((step, idx) => (
              <div key={step} className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-xs font-semibold text-white">
                  {idx + 1}
                </span>
                <p className="text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
