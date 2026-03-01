import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { glassCardClass } from "./nurse.ui";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [appointmentsRes, vitalsRes, assessmentsRes] = await Promise.all([
          nurseDashboardService.getAssignedAppointments(),
          nurseDashboardService.listVitals(),
          nurseDashboardService.listPainAssessments()
        ]);
        setAppointments(Array.isArray(appointmentsRes) ? appointmentsRes : []);
        setVitals(Array.isArray(vitalsRes) ? vitalsRes : []);
        setAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load nurse reports.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    return {
      totalAppointments: appointments.length,
      vitalsCount: vitals.length,
      assessmentsCount: assessments.length
    };
  }, [appointments, vitals, assessments]);

  const loadByPt = useMemo(() => {
    const map = new Map();
    appointments.forEach((row) => {
      const key = row?.physiotherapist?.physioId || row?.physiotherapist?.userId || row?.physiotherapist?._id || "PT";
      const name = row?.physiotherapist?.name || "Physiotherapist";
      const existing = map.get(key) || { name, sessions: 0 };
      existing.sessions += 1;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.sessions - a.sessions);
  }, [appointments]);

  const intakeData = [
    { name: "Vitals", value: metrics.vitalsCount, color: "#0ea5e9" },
    { name: "Assessments", value: metrics.assessmentsCount, color: "#a855f7" }
  ];

  return (
    <DashboardLayout title="Nurse Reports">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Appointments Handled</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "..." : metrics.totalAppointments}</p>
        </div>
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Vitals Entered</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "..." : metrics.vitalsCount}</p>
        </div>
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Assessments Done</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "..." : metrics.assessmentsCount}</p>
        </div>
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Vitals vs Assessments</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {loading ? "..." : `${metrics.vitalsCount}/${metrics.assessmentsCount}`}
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className={glassCardClass}>
          <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Session Load per PT</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loadByPt}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="name" tick={{ fill: "#334155", fontSize: 12 }} />
                <YAxis tick={{ fill: "#334155", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={glassCardClass}>
          <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Vitals vs Assessments</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={intakeData} dataKey="value" nameKey="name" outerRadius={110} innerRadius={60}>
                  {intakeData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
