import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Dumbbell } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import patientDashboardService from "../../services/patient.dashboard.service";
import { calculatePercent, cardTitleClass, first, glassCardClass, sectionMutedClass } from "./patient.ui";

export default function TreatmentPlan() {
  const [loading, setLoading] = useState(true);
  const [savingExerciseId, setSavingExerciseId] = useState("");
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPlan = async () => {
    setLoading(true);
    setError("");
    try {
      const identity = patientDashboardService.getPatientIdentity();
      const patientRef = identity.patientId || identity.mongoId;
      const row = await patientDashboardService.getTreatmentPlan(patientRef);
      setPlan(row || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load treatment plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const progressPercent = useMemo(() => {
    const exercises = Array.isArray(plan?.exercises) ? plan.exercises : [];
    const completed = exercises.filter((row) => row.completed).length;
    return calculatePercent(completed, exercises.length);
  }, [plan]);

  const markExercise = async (exerciseId) => {
    setSavingExerciseId(exerciseId);
    setError("");
    setMessage("");
    try {
      const identity = patientDashboardService.getPatientIdentity();
      const patientRef = identity.patientId || identity.mongoId;
      await patientDashboardService.markExerciseComplete({ patientId: patientRef, exerciseId });
      setMessage("Exercise completion updated.");
      await loadPlan();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update exercise completion.");
    } finally {
      setSavingExerciseId("");
    }
  };

  const exercises = Array.isArray(plan?.exercises) ? plan.exercises : [];

  return (
    <DashboardLayout title="Treatment Plan">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className={`${glassCardClass} mb-8`}>
        <h3 className={`${cardTitleClass} mb-4`}>Active Treatment Plan</h3>
        {loading ? (
          <p className={sectionMutedClass}>Loading treatment data...</p>
        ) : (
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <p>
              <span className="font-semibold">Diagnosis:</span> {first(plan?.diagnosis)}
            </p>
            <p>
              <span className="font-semibold">Recovery Stage:</span> {first(plan?.recoveryStage)}
            </p>
            <p className="md:col-span-2">
              <span className="font-semibold">Rehab Goals:</span>{" "}
              {Array.isArray(plan?.rehabGoals) && plan.rehabGoals.length ? plan.rehabGoals.join(", ") : first(plan?.rehabGoals)}
            </p>
            <p>
              <span className="font-semibold">Duration:</span> {first(plan?.durationWeeks, 0)} weeks
            </p>
            <p className="md:col-span-2">
              <span className="font-semibold">PT Remarks:</span> {first(plan?.physiotherapistRemarks || plan?.remarks)}
            </p>
          </div>
        )}
      </section>

      <section className={`${glassCardClass} mb-8`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className={cardTitleClass}>Exercise Completion</h3>
          <p className="text-sm font-semibold text-cyan-700">{progressPercent}%</p>
        </div>
        <div className="h-3 rounded-full bg-slate-200">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {loading ? <p className={sectionMutedClass}>Loading exercises...</p> : null}
        {!loading && !exercises.length ? <p className={sectionMutedClass}>No exercise plan assigned.</p> : null}
        {exercises.map((row) => (
          <motion.div key={row.id || row._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={glassCardClass}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{first(row.name)}</p>
                <p className="text-xs text-slate-600">{first(row.frequency)}</p>
              </div>
              {row.completed ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Dumbbell size={18} className="text-cyan-700" />}
            </div>

            <div className="mb-3 h-32 rounded-xl border border-dashed border-cyan-300 bg-cyan-50/60 p-2 text-xs text-cyan-700">
              Video thumbnail placeholder
            </div>

            <div className="space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Sets:</span> {first(row.sets, 0)}
              </p>
              <p>
                <span className="font-semibold">Reps:</span> {first(row.reps, 0)}
              </p>
              <p>
                <span className="font-semibold">Frequency:</span> {first(row.frequency)}
              </p>
              <p>
                <span className="font-semibold">Safety Notes:</span> {first(row.safetyNotes)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => markExercise(row.id || row._id)}
              disabled={row.completed || savingExerciseId === String(row.id || row._id)}
              className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60"
            >
              {row.completed ? "Completed" : savingExerciseId === String(row.id || row._id) ? "Updating..." : "Mark as Completed"}
            </button>
          </motion.div>
        ))}
      </section>
    </DashboardLayout>
  );
}
