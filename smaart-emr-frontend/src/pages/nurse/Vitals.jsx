import { useEffect, useMemo, useState } from "react";
import { Activity, Plus, Edit2, Trash2 } from "lucide-react";
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
  height: "",
  weight: "",
  bloodPressure: "",
  pulse: "",
  temperature: "",
  oxygenSaturation: "",
  painScale: "",
  painAffectedArea: "",
  painNotes: ""
};

const isSameDay = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export default function Vitals() {
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, appts] = await Promise.all([
        nurseDashboardService.listVitals(),
        nurseDashboardService.getAssignedPatientSummary(todayIso())
      ]);
      setVitals(Array.isArray(rows) ? rows : []);
      setAppointments(Array.isArray(appts) ? appts : []);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load vitals." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { label: "Recorded", render: (row) => formatDateTime(row.recordedAt || row.createdAt) },
      { label: "Patient", render: (row) => first(row?.patient?.patientId || row?.patient?.firstName) },
      { label: "BP", render: (row) => first(row.bloodPressure) },
      { label: "Pulse", render: (row) => first(row.pulse) },
      { label: "Temp", render: (row) => first(row.temperature) },
      {
        label: "Actions",
        render: (row) => {
          const canEdit = isSameDay(row.recordedAt || row.createdAt);
          return (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!canEdit) return;
                  setForm({
                    patientId: row?.patient?.patientId || "",
                    appointmentId: row?.appointment?.appointmentId || "",
                    height: row.height || "",
                    weight: row.weight || "",
                    bloodPressure: row.bloodPressure || "",
                    pulse: row.pulse || "",
                    temperature: row.temperature || "",
                    oxygenSaturation: row.oxygenSaturation || "",
                    painScale: row.painScale || "",
                    painAffectedArea: row.painAffectedArea || "",
                    painNotes: row.painNotes || ""
                  });
                  setEditingId(row._id);
                  setModalOpen(true);
                }}
                className={`rounded-lg p-2 ${canEdit ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => canEdit && setConfirm({ open: true, id: row._id })}
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
    if (!form.patientId) {
      setToast({ type: "error", message: "Select patient before saving vitals." });
      return;
    }
    try {
      if (editingId) {
        await nurseDashboardService.updateVitals(editingId, form);
        setToast({ type: "success", message: "Vitals updated." });
      } else {
        await nurseDashboardService.recordVitals(form);
        setToast({ type: "success", message: "Vitals recorded." });
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to save vitals." });
    }
  };

  const handleDelete = async () => {
    try {
      await nurseDashboardService.deleteVitals(confirm.id);
      setConfirm({ open: false, id: null });
      setToast({ type: "success", message: "Vitals deleted." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to delete vitals." });
    }
  };

  return (
    <DashboardLayout title="Vitals">
      <PageWrapper>
        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Vitals Records</h2>
              <p className="text-sm text-slate-500">Create and update vitals within same day.</p>
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
            >
              <Plus size={16} /> Add Vitals
            </button>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : null}
        <DataTable rows={vitals} columns={columns} loading={loading} emptyMessage="No vitals recorded." />
      </PageWrapper>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit Vitals" : "Add Vitals"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
            >
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
              <option key={row.patientId} value={row.patientId}>
                {row.patientId} - {row.patientName}
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
              <option key={row.appointmentId} value={row.appointmentId}>
                {row.appointmentId} - {row.appointmentDate?.split("T")?.[0] || ""}
              </option>
            ))}
          </select>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="Height (cm)" value={form.height} onChange={(e) => setForm((prev) => ({ ...prev, height: e.target.value }))} />
            <input className={inputClass} placeholder="Weight (kg)" value={form.weight} onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))} />
            <input className={inputClass} placeholder="Blood Pressure" value={form.bloodPressure} onChange={(e) => setForm((prev) => ({ ...prev, bloodPressure: e.target.value }))} />
            <input className={inputClass} placeholder="Pulse" value={form.pulse} onChange={(e) => setForm((prev) => ({ ...prev, pulse: e.target.value }))} />
            <input className={inputClass} placeholder="Temperature" value={form.temperature} onChange={(e) => setForm((prev) => ({ ...prev, temperature: e.target.value }))} />
            <input className={inputClass} placeholder="SpO2" value={form.oxygenSaturation} onChange={(e) => setForm((prev) => ({ ...prev, oxygenSaturation: e.target.value }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="Pain Score (1-10)" value={form.painScale} onChange={(e) => setForm((prev) => ({ ...prev, painScale: e.target.value }))} />
            <input className={inputClass} placeholder="Pain Area" value={form.painAffectedArea} onChange={(e) => setForm((prev) => ({ ...prev, painAffectedArea: e.target.value }))} />
          </div>
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Pain Notes"
            value={form.painNotes}
            onChange={(e) => setForm((prev) => ({ ...prev, painNotes: e.target.value }))}
          />
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={confirm.open}
        title="Delete Vitals?"
        message="This will deactivate the vitals record."
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
