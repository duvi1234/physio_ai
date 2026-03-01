import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import patientDashboardService from "../../services/patient.dashboard.service";
import {
  buildSummaryDocument,
  cardTitleClass,
  first,
  formatDateTime,
  glassCardClass,
  sectionMutedClass
} from "./patient.ui";

const buildPdf = (session, pain, posture, plan) => {
  const exercises = Array.isArray(plan?.exercises) ? plan.exercises : [];
  return buildSummaryDocument({
    title: `Consultation Summary - ${first(session?.appointmentId || session?.id)}`,
    sections: [
      {
        title: "Session",
        content: `
          <p><b>Date:</b> ${formatDateTime(session?.sessionDate || session?.appointmentDate)}</p>
          <p><b>Physiotherapist:</b> ${first(session?.physiotherapist?.name || session?.consultant?.name)}</p>
          <p><b>Status:</b> ${first(session?.sessionStatus || session?.status)}</p>
        `
      },
      {
        title: "Pain Map Snapshot",
        content: `
          <p><b>Pain Score:</b> ${first(pain?.painIntensity || pain?.painScore, "0")}/10</p>
          <p><b>Pain Type:</b> ${first(pain?.painType)}</p>
          <p><b>Body Area:</b> ${first(pain?.bodyArea)}</p>
          <p><b>Notes:</b> ${first(pain?.notes)}</p>
        `
      },
      {
        title: "Posture Summary",
        content: `
          <p><b>Alignment Score:</b> ${first(posture?.alignmentScore || posture?.score)}</p>
          <p><b>Improvement:</b> ${first(posture?.improvementPercent || posture?.improvement)}%</p>
          <p><b>Comments:</b> ${first(posture?.comments || posture?.remarks)}</p>
        `
      },
      {
        title: "Exercise Plan",
        content: exercises
          .slice(0, 8)
          .map(
            (row) =>
              `<p><b>${row.name}</b> - ${first(row.sets, 0)} sets x ${first(row.reps, 0)} reps (${first(row.frequency)})</p>`
          )
          .join("")
      },
      {
        title: "PT Remarks",
        content: `<p>${first(session?.consultation?.notes || session?.consultationNotes || plan?.physiotherapistRemarks)}</p>`
      }
    ]
  });
};

export default function ConsultationSummaries() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [painRows, setPainRows] = useState([]);
  const [postureRows, setPostureRows] = useState([]);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const identity = patientDashboardService.getPatientIdentity();
        const patientRef = identity.patientId || identity.mongoId;
        const [sessionRows, painData, postureData, planData] = await Promise.all([
          patientDashboardService.getSessions(patientRef),
          patientDashboardService.getPainAssessments(patientRef),
          patientDashboardService.getPosturalAssessments(patientRef),
          patientDashboardService.getTreatmentPlan(patientRef)
        ]);
        const completed = (Array.isArray(sessionRows) ? sessionRows : []).filter((row) =>
          ["COMPLETED"].includes(String(row.sessionStatus || row.status).toUpperCase())
        );
        setSessions(completed);
        setPainRows(Array.isArray(painData) ? painData : []);
        setPostureRows(Array.isArray(postureData) ? postureData : []);
        setPlan(planData || null);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load consultation summaries.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const downloadSummary = (session) => {
    const html = buildPdf(session, painRows[0], postureRows[0], plan);
    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <DashboardLayout title="Consultation Summaries">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className={glassCardClass}>
        <h3 className={`${cardTitleClass} mb-4`}>Completed Session Summaries</h3>
        {loading ? <p className={sectionMutedClass}>Loading summaries...</p> : null}
        {!loading && !sessions.length ? <p className={sectionMutedClass}>No completed consultation summaries available.</p> : null}
        <div className="space-y-4">
          {sessions.map((row) => (
            <motion.div
              key={row.id || row._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-white/35 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-700">
                  <p className="text-base font-semibold text-slate-900">
                    {formatDateTime(row.sessionDate || row.appointmentDate || row.createdAt)}
                  </p>
                  <p>Physiotherapist: {first(row?.physiotherapist?.name || row?.consultant?.name)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSummary(row)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <Download size={14} />
                  Download PDF
                </button>
              </div>
              <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-slate-500">PAIN MAP SNAPSHOT</p>
                  <p>Score: {first(painRows[0]?.painIntensity || painRows[0]?.painScore, "0")}/10</p>
                  <p>Area: {first(painRows[0]?.bodyArea)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-slate-500">POSTURE SUMMARY</p>
                  <p>Alignment: {first(postureRows[0]?.alignmentScore || postureRows[0]?.score)}</p>
                  <p>Improvement: {first(postureRows[0]?.improvementPercent || postureRows[0]?.improvement)}%</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-slate-500">EXERCISE PLAN SUMMARY</p>
                  <p>Exercises: {Array.isArray(plan?.exercises) ? plan.exercises.length : 0}</p>
                  <p>Stage: {first(plan?.recoveryStage)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-slate-500">PT REMARKS</p>
                  <p>{first(row?.consultation?.notes || row?.consultationNotes || plan?.physiotherapistRemarks)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
