import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, ListChecks, MessageSquareMore } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import patientDashboardService from "../../services/patient.dashboard.service";
import { calculatePercent, cardTitleClass, first, glassCardClass, sectionMutedClass } from "./patient.ui";

const streakKey = (patientRef) => `exerciseTracker:streak:${patientRef || "self"}`;
const checklistKey = (patientRef) => `exerciseTracker:daily:${patientRef || "self"}`;

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const saveJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export default function ExerciseTracker() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [dailyState, setDailyState] = useState({});
  const [streak, setStreak] = useState(0);
  const identity = patientDashboardService.getPatientIdentity();
  const patientRef = identity.patientId || identity.mongoId || "self";

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [planRow, sessionRows] = await Promise.all([
        patientDashboardService.getTreatmentPlan(patientRef),
        patientDashboardService.getSessions(patientRef)
      ]);
      setPlan(planRow || null);
      setSessions(Array.isArray(sessionRows) ? sessionRows : []);
      const storedChecklist = readJson(checklistKey(patientRef), {});
      setDailyState(storedChecklist);
      setStreak(Number(readJson(streakKey(patientRef), 0)));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load exercise tracker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exercises = Array.isArray(plan?.exercises) ? plan.exercises : [];
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayChecklist = dailyState?.[todayKey] || {};

  const weeklyCompletion = useMemo(() => {
    const entries = Object.entries(dailyState || {});
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const lastWeek = entries.filter(([date]) => new Date(date).getTime() >= weekAgo);
    if (!lastWeek.length || !exercises.length) return 0;
    const completed = lastWeek.reduce((sum, [, values]) => {
      const count = Object.values(values || {}).filter(Boolean).length;
      return sum + count;
    }, 0);
    const total = lastWeek.length * exercises.length;
    return calculatePercent(completed, total);
  }, [dailyState, exercises.length]);

  const missedSessions = useMemo(
    () =>
      sessions.filter((row) => ["NO_SHOW", "CANCELLED"].includes(String(row.sessionStatus || row.status).toUpperCase())).length,
    [sessions]
  );

  const markDaily = (exerciseId, value) => {
    const nextDay = {
      ...todayChecklist,
      [exerciseId]: value
    };
    const nextState = {
      ...dailyState,
      [todayKey]: nextDay
    };
    setDailyState(nextState);
    saveJson(checklistKey(patientRef), nextState);
  };

  const finalizeDay = () => {
    const completed = Object.values(todayChecklist).filter(Boolean).length;
    const allDone = exercises.length > 0 && completed === exercises.length;
    const nextStreak = allDone ? streak + 1 : 0;
    setStreak(nextStreak);
    saveJson(streakKey(patientRef), nextStreak);
    setMessage(allDone ? "Excellent. Daily exercise checklist completed." : "Checklist saved. Complete all exercises to continue streak.");
  };

  return (
    <DashboardLayout title="Exercise Tracker">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Weekly Completion</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{weeklyCompletion}%</p>
        </div>
        <div className={glassCardClass}>
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-amber-500" />
            <p className="text-xs uppercase text-slate-500">Streak Counter</p>
          </div>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{streak} days</p>
        </div>
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Missed Sessions</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{missedSessions}</p>
        </div>
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Exercises Assigned</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{exercises.length}</p>
        </div>
      </section>

      <section className={`${glassCardClass} mt-8`}>
        <div className="mb-4 flex items-center gap-2">
          <ListChecks size={18} className="text-cyan-700" />
          <h3 className={cardTitleClass}>Daily Checklist</h3>
        </div>
        {loading ? <p className={sectionMutedClass}>Loading exercise checklist...</p> : null}
        {!loading && !exercises.length ? <p className={sectionMutedClass}>No exercises available in active treatment plan.</p> : null}
        <div className="space-y-3">
          {exercises.map((row) => {
            const rowId = String(row.id || row._id);
            return (
              <motion.label
                key={rowId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl bg-white/35 p-3 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={Boolean(todayChecklist[rowId])}
                  onChange={(e) => markDaily(rowId, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span>
                  <span className="block font-semibold text-slate-900">{first(row.name)}</span>
                  <span className="text-xs text-slate-600">
                    {first(row.sets, 0)} sets x {first(row.reps, 0)} reps | {first(row.frequency)}
                  </span>
                </span>
              </motion.label>
            );
          })}
        </div>
        {!!exercises.length ? (
          <button
            type="button"
            onClick={finalizeDay}
            className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
          >
            Save Daily Progress
          </button>
        ) : null}
      </section>

      <section className={`${glassCardClass} mt-8`}>
        <div className="mb-3 flex items-center gap-2">
          <MessageSquareMore size={18} className="text-cyan-700" />
          <h3 className={cardTitleClass}>Therapist Feedback</h3>
        </div>
        <p className="text-sm text-slate-700">
          {first(plan?.physiotherapistRemarks || plan?.remarks, "Your therapist feedback will appear here after consultation updates.")}
        </p>
      </section>
    </DashboardLayout>
  );
}
