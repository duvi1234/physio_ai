import { useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageWrapper from "../../components/dashboard/PageWrapper";
import ToastAlert from "../../components/dashboard/ToastAlert";
import physioService from "../../services/physio.service";
import { inputClass } from "../nurse/nurse.ui";

export default function Analytics() {
  const [patientId, setPatientId] = useState("");
  const [data, setData] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await physioService.getAnalytics(patientId);
      setData(res || null);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load analytics." });
    } finally {
      setLoading(false);
    }
  };

  const painData = data?.painTrend?.labels?.map((label, idx) => ({
    name: label,
    value: data?.painTrend?.datasets?.[0]?.data?.[idx] || 0
  }));

  const postureData = data?.postureTrend?.labels?.map((label, idx) => ({
    name: label,
    value: data?.postureTrend?.datasets?.[0]?.data?.[idx] || 0
  }));

  return (
    <DashboardLayout title="Analytics">
      <PageWrapper>
        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-900">Patient Analytics</h2>
          <p className="text-sm text-slate-500">Analyze pain and posture progression.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              className={inputClass}
              placeholder="Patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
            <button
              onClick={load}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
            >
              {loading ? "Loading..." : "Load"}
            </button>
          </div>
        </div>

        {painData?.length ? (
          <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-slate-900">Pain Trend</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={painData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {postureData?.length ? (
          <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-slate-900">Posture Trend</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={postureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </PageWrapper>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
