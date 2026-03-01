import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, ClipboardCheck } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageWrapper from "../../components/dashboard/PageWrapper";
import DataTable from "../../components/dashboard/DataTable";
import Modal from "../../components/admin/Modal";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import LoadingSpinner from "../../components/dashboard/LoadingSpinner";
import ToastAlert from "../../components/dashboard/ToastAlert";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { first, formatDateTime, inputClass, todayIso } from "./nurse.ui";

const emptyForm = {
  patientId: "",
  appointmentId: "",
  painScore: "",
  bodyArea: "",
  painType: "",
  description: ""
};

const isSameDay = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === new Date().toDateString();
};

export default function PainAssessments() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [assessments, appts] = await Promise.all([
        nurseDashboardService.listPainAssessments(),
        nurseDashboardService.getAssignedAppointments({ date: todayIso() })
      ]);
      setRows(Array.isArray(assessments) ? assessments : []);
      setAppointments(Array.isArray(appts) ? appts : []);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load assessments." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { label: "Recorded", render: (row) => formatDateTime(row.createdAt) },
      { label: "Patient", render: (row) => first(row?.patient?.patientId) },
      { label: "Score", render: (row) => first(row.painScore) },
      { label: "Area", render: (row) => first(row.bodyArea) },
      {
        label: "Actions",
        render: (row) => {
          const canEdit = isSameDay(row.createdAt);
          return (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!canEdit) return;
                  setForm({
                    patientId: row?.patient?.patientId || "",
                    appointmentId: row?.appointment?.appointmentId || "",
                    painScore: row.painScore || "",
                    bodyArea: row.bodyArea || "",
                    painType: row.painType || "",
                    description: row.description || ""
                  });
                  setEditingId(row.assessmentId || row._id);
                  setModalOpen(true);
                }}
                className={`rounded-lg p-2 ${canEdit ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => canEdit && setConfirm({ open: true, id: row.assessmentId || row._id })}
                className={`rounded-lg p-2 ${canEdit ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400"}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        }
      }
    ],
    []
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.painScore || !form.bodyArea) {
      setToast({ type: "error", message: "Patient, pain score and body area are required." });
      return;
    }
    try {
      if (editingId) {
        await nurseDashboardService.updatePainAssessment(editingId, form);
        setToast({ type: "success", message: "Assessment updated." });
      } else {
        await nurseDashboardService.createPainAssessment(form);
        setToast({ type: "success", message: "Assessment created." });
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to save assessment." });
    }
  };

  const handleDelete = async () => {
    try {
      await nurseDashboardService.deletePainAssessment(confirm.id);
      setConfirm({ open: false, id: null });
      setToast({ type: "success", message: "Assessment deleted." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to delete assessment." });
    }
  };

  return (
    <DashboardLayout title="Pain Assessments">
      <PageWrapper>
        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Pain Assessments</h2>
              <p className="text-sm text-slate-500">Track and update assessments per session.</p>
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
            >
              <Plus size={16} /> New Assessment
            </button>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : null}
        <DataTable rows={rows} columns={columns} loading={loading} emptyMessage="No pain assessments." />
      </PageWrapper>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit Assessment" : "New Assessment"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white">
              Save
            </button>
          </>
        }
      >
        <form className="space-y-3">
          <select
            className={inputClass}
            value={form.patientId}
            onChange={(e) => setForm((prev) => ({ ...prev, patientId: e.target.value }))}
          >
            <option value="">Select Patient</option>
            {appointments.map((row) => (
              <option key={row?.patient?.patientId || row?.patient?._id} value={row?.patient?.patientId || row?.patient?._id}>
                {row?.patient?.patientId} - {row?.patient?.firstName} {row?.patient?.lastName}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={form.appointmentId}
            onChange={(e) => setForm((prev) => ({ ...prev, appointmentId: e.target.value }))}
          >
            <option value="">Select Appointment</option>
            {appointments.map((row) => (
              <option key={row.appointmentId || row._id} value={row.appointmentId || row._id}>
                {row.appointmentId} - {row.timeSlot}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Pain Score (1-10)"
            value={form.painScore}
            onChange={(e) => setForm((prev) => ({ ...prev, painScore: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder="Body Area"
            value={form.bodyArea}
            onChange={(e) => setForm((prev) => ({ ...prev, bodyArea: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder="Pain Type"
            value={form.painType}
            onChange={(e) => setForm((prev) => ({ ...prev, painType: e.target.value }))}
          />
          <textarea
            rows={3}
            className={inputClass}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={confirm.open}
        title="Delete Assessment?"
        message="This will deactivate the assessment."
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
