import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import AdminLayout from "../../layouts/AdminLayout";
import PageWrapper from "../../components/admin/PageWrapper";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import EmptyState from "../../components/admin/EmptyState";
import { Toast } from "../../components/admin/Toast";
import adminService from "../../services/admin.service";

const unwrap = (payload) => payload?.data || payload || {};

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [patientGrowth, setPatientGrowth] = useState(null);
  const [appointmentTrends, setAppointmentTrends] = useState(null);
  const [physioWorkload, setPhysioWorkload] = useState(null);
  const [painAreas, setPainAreas] = useState(null);
  const [treatmentCompletion, setTreatmentCompletion] = useState(null);
  const [toast, setToast] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [growth, trends, workload, pain, completion] = await Promise.all([
        adminService.reports.patientGrowth(),
        adminService.reports.appointmentTrends(),
        adminService.reports.physioWorkload(),
        adminService.reports.painAreas(),
        adminService.reports.treatmentCompletion()
      ]);
      setPatientGrowth(unwrap(growth));
      setAppointmentTrends(unwrap(trends));
      setPhysioWorkload(unwrap(workload));
      setPainAreas(unwrap(pain));
      setTreatmentCompletion(unwrap(completion));
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to load reports." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const lineData = patientGrowth?.labels?.map((label, idx) => ({
    name: label,
    value: patientGrowth?.datasets?.[0]?.data?.[idx] || 0
  }));

  const barData = appointmentTrends?.labels?.map((label, idx) => ({
    name: label,
    value: appointmentTrends?.datasets?.[0]?.data?.[idx] || 0
  }));

  const workloadData = physioWorkload?.labels?.map((label, idx) => ({
    name: label,
    value: physioWorkload?.datasets?.[0]?.data?.[idx] || 0
  }));

  const painData = painAreas?.labels?.map((label, idx) => ({
    name: label,
    value: painAreas?.datasets?.[0]?.data?.[idx] || 0,
    color: painAreas?.datasets?.[0]?.backgroundColor?.[idx] || "#0891b2"
  }));

  const completionData = treatmentCompletion
    ? [
        { name: "Completed", value: treatmentCompletion.completed || 0, color: "#10b981" },
        { name: "Pending", value: treatmentCompletion.pending || 0, color: "#f59e0b" },
        { name: "Cancelled", value: treatmentCompletion.cancelled || 0, color: "#ef4444" }
      ]
    : [];

  return (
    <AdminLayout title="Reports & Analytics">
      <PageWrapper>
        {loading ? <LoadingSpinner label="Loading analytics..." /> : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Patient Growth</h3>
            {lineData?.length ? (
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#0891b2" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No growth data" message="Patient growth data will appear here." />
            )}
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Appointment Trends</h3>
            {barData?.length ? (
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#0891b2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No appointment trend data" message="Appointment trends will appear here." />
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Physio Workload</h3>
            {workloadData?.length ? (
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis dataKey="name" type="category" width={120} stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No workload data" message="Physio workload will appear here." />
            )}
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Common Pain Areas</h3>
            {painData?.length ? (
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Pie data={painData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                      {painData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No pain data" message="Pain area analytics will appear here." />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-slate-900">Treatment Completion</h3>
          {completionData.length ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie data={completionData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                    {completionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No completion data" message="Completion metrics will appear here." />
          )}
        </div>
      </PageWrapper>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </AdminLayout>
  );
}
