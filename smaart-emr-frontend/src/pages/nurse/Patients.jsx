import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageWrapper from "../../components/dashboard/PageWrapper";
import DataTable from "../../components/dashboard/DataTable";
import LoadingSpinner from "../../components/dashboard/LoadingSpinner";
import ToastAlert from "../../components/dashboard/ToastAlert";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { first, formatDate, inputClass } from "./nurse.ui";

export default function Patients() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await nurseDashboardService.getAssignedPatients(search);
      setPatients(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load patients." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const columns = useMemo(
    () => [
      { label: "Patient ID", render: (row) => <span className="font-semibold text-cyan-700">{first(row.patientId)}</span> },
      { label: "Name", render: (row) => `${first(row.firstName, "")} ${first(row.lastName, "")}`.trim() },
      { label: "Phone", render: (row) => first(row.phone) },
      { label: "Last Visit", render: (row) => formatDate(row.lastVisit) },
      {
        label: "Action",
        render: (row) => (
          <button
            onClick={() => navigate(`/dashboard/nurse/patients/${row.patientId || row._id}`)}
            className="rounded-lg bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700"
          >
            View
          </button>
        )
      }
    ],
    [navigate]
  );

  return (
    <DashboardLayout title="Assigned Patients">
      <PageWrapper>
        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Patients</h2>
              <p className="text-sm text-slate-500">Only patients assigned to your appointments.</p>
            </div>
            <Users className="text-cyan-600" />
          </div>
          <div className="mt-4">
            <input
              className={inputClass}
              placeholder="Search by ID or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? <LoadingSpinner /> : null}
        <DataTable rows={patients} columns={columns} loading={loading} emptyMessage="No assigned patients." />
      </PageWrapper>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
