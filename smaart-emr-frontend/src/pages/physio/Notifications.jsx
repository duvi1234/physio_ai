import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageWrapper from "../../components/dashboard/PageWrapper";
import DataTable from "../../components/dashboard/DataTable";
import LoadingSpinner from "../../components/dashboard/LoadingSpinner";
import ToastAlert from "../../components/dashboard/ToastAlert";
import physioService from "../../services/physio.service";
import { first, formatDateTime } from "../nurse/nurse.ui";

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const appts = await physioService.getAppointments({ tab: "UPCOMING" });
        const notifications = (appts || []).map((row) => ({
          id: row._id,
          title: `New appointment assigned`,
          message: `${first(row?.patient?.firstName)} ${first(row?.patient?.lastName)} - ${first(row.timeSlot)}`,
          createdAt: row.updatedAt || row.createdAt
        }));
        setRows(notifications);
      } catch (err) {
        setToast({ type: "error", message: err.message || "Unable to load notifications." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout title="Notifications">
      <PageWrapper>
        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
              <p className="text-sm text-slate-500">Latest assignment and patient alerts.</p>
            </div>
            <Bell className="text-cyan-600" />
          </div>
        </div>

        {loading ? <LoadingSpinner /> : null}
        <DataTable
          rows={rows}
          columns={[
            { label: "Title", render: (row) => first(row.title) },
            { label: "Message", render: (row) => first(row.message) },
            { label: "Time", render: (row) => formatDateTime(row.createdAt) }
          ]}
          loading={loading}
          emptyMessage="No notifications."
        />
      </PageWrapper>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
