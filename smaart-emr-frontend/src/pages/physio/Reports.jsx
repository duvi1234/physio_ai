import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageWrapper from "../../components/dashboard/PageWrapper";
import DataTable from "../../components/dashboard/DataTable";
import LoadingSpinner from "../../components/dashboard/LoadingSpinner";
import ToastAlert from "../../components/dashboard/ToastAlert";
import physioService from "../../services/physio.service";
import { first, inputClass } from "../nurse/nurse.ui";

export default function Reports() {
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [toast, setToast] = useState(null);

  const load = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const data = await physioService.getPatientCase(patientId);
      setCaseData(data || null);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load report data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) load();
  }, [patientId]);

  return (
    <DashboardLayout title="Reports">
      <PageWrapper>
        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-900">Generate Patient Report</h2>
          <p className="text-sm text-slate-500">Enter a patient ID to compile session history.</p>
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
              Generate
            </button>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : null}

        {caseData ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-slate-900">Session Notes</h3>
              <DataTable
                rows={caseData.notes || []}
                columns={[
                  { label: "Diagnosis", render: (row) => first(row.diagnosis) },
                  { label: "Observations", render: (row) => first(row.observations) },
                  { label: "Recommendations", render: (row) => first(row.recommendations) }
                ]}
                emptyMessage="No session notes."
              />
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-slate-900">Treatment Plans</h3>
              <DataTable
                rows={caseData.plans || []}
                columns={[
                  { label: "Summary", render: (row) => first(row.summary) },
                  { label: "Status", render: (row) => first(row.status) },
                  { label: "Exercises", render: (row) => row.exercises?.length || 0 }
                ]}
                emptyMessage="No treatment plans."
              />
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
