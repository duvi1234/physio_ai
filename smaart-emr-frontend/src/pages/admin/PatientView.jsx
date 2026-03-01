import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Edit2, Save, Activity, CalendarClock } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import PageWrapper from "../../components/admin/PageWrapper";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import StatusBadge from "../../components/admin/StatusBadge";
import EmptyState from "../../components/admin/EmptyState";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import { Toast } from "../../components/admin/Toast";
import adminService from "../../services/admin.service";
import painService from "../../services/painService";
import PainTimelineChart from "../../components/Pain3D/PainTimelineChart";
import PainReportExport from "../../components/Pain3D/PainReportExport";

const emptyForm = {
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: ""
};

const unwrap = (payload) => payload?.data || payload || {};

const appointmentStatusOptions = [
  "PENDING",
  "CONFIRMED",
  "ARRIVED",
  "INTAKE_COMPLETED",
  "READY_FOR_PT",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW"
];

export default function PatientView() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [painRows, setPainRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, id: null, status: "CONFIRMED" });
  const painPanelRef = useRef(null);
  const painChartRef = useRef(null);

  const loadPatient = async () => {
    setLoading(true);
    try {
      const [patientRes, timelineRes] = await Promise.all([
        adminService.patients.get(patientId),
        adminService.patients.getTimeline(patientId)
      ]);
      const patientData = unwrap(patientRes);
      const timelineData = unwrap(timelineRes);
      setPatient(patientData);
      setTimeline(timelineData);
      try {
        const painData = await painService.listByPatient(patientId);
        setPainRows(Array.isArray(painData) ? painData : []);
      } catch {
        setPainRows([]);
      }
      setForm({
        ...emptyForm,
        firstName: patientData.firstName || "",
        lastName: patientData.lastName || "",
        gender: patientData.gender || "",
        dateOfBirth: patientData.dateOfBirth?.split("T")[0] || "",
        phone: patientData.phone || "",
        email: patientData.email || "",
        addressLine1: patientData.addressLine1 || "",
        addressLine2: patientData.addressLine2 || "",
        city: patientData.city || "",
        state: patientData.state || "",
        postalCode: patientData.postalCode || "",
        country: patientData.country || "",
        emergencyContactName: patientData.emergencyContactName || "",
        emergencyContactRelationship: patientData.emergencyContactRelationship || "",
        emergencyContactPhone: patientData.emergencyContactPhone || ""
      });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load patient profile." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.patients.update(patientId, form);
      setToast({ type: "success", message: "Patient updated successfully." });
      setEditOpen(false);
      await loadPatient();
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const updateAppointmentStatus = async () => {
    try {
      await adminService.appointments.updateStatus(statusModal.id, statusModal.status);
      setToast({ type: "success", message: "Appointment status updated." });
      setStatusModal({ open: false, id: null, status: "CONFIRMED" });
      await loadPatient();
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  };

  const appointmentColumns = useMemo(
    () => [
      {
        key: "appointmentId",
        label: "Appointment ID",
        render: (value) => <span className="font-semibold text-cyan-700">{value || "-"}</span>
      },
      {
        key: "physiotherapist",
        label: "Physio",
        render: (_, row) => row?.physiotherapist?.name || row?.physiotherapist?.userId || "-"
      },
      {
        key: "appointmentDate",
        label: "Date",
        render: (value) => (value ? new Date(value).toLocaleDateString() : "-")
      },
      { key: "timeSlot", label: "Time" },
      { key: "status", label: "Status", render: (value) => <StatusBadge status={value} /> },
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <button
            onClick={() =>
              setStatusModal({ open: true, id: row._id || row.appointmentId, status: row.status || "CONFIRMED" })
            }
            className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
          >
            <Edit2 size={14} />
          </button>
        )
      }
    ],
    []
  );

  const vitalsColumns = [
    {
      key: "recordedAt",
      label: "Recorded",
      render: (value, row) =>
        new Date(value || row.createdAt).toLocaleString()
    },
    { key: "bloodPressure", label: "BP" },
    { key: "pulse", label: "Pulse" },
    { key: "temperature", label: "Temp" },
    { key: "oxygenSaturation", label: "SpO2" },
    { key: "painScale", label: "Pain" }
  ];

  const painColumns = [
    { key: "recordedAt", label: "Date", render: (value) => new Date(value).toLocaleDateString() },
    { key: "painScale", label: "Pain Scale" },
    { key: "affectedArea", label: "Area" },
    { key: "notes", label: "Notes" }
  ];

  return (
    <AdminLayout title="Patient Profile">
      <PageWrapper>
        {loading ? <LoadingSpinner label="Loading patient profile..." /> : null}

        {patient ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-sm text-slate-600">Patient ID: {patient.patientId}</p>
                </div>
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700"
                >
                  <Edit2 size={16} /> Edit Info
                </button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm text-slate-700">
                <div>
                  <p className="text-xs uppercase text-slate-500">Gender</p>
                  <p className="font-semibold">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Age</p>
                  <p className="font-semibold">{patient.age ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Phone</p>
                  <p className="font-semibold">{patient.phone}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Email</p>
                  <p className="font-semibold">{patient.email || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase text-slate-500">Address</p>
                  <p className="font-semibold">{patient.address || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase text-slate-500">Emergency Contact</p>
                  <p className="font-semibold">
                    {patient.emergencyContactName} - {patient.emergencyContactPhone}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">Quick Stats</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                  <span>Appointments</span>
                  <span className="font-semibold">{timeline?.sessions?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                  <span>Vitals Records</span>
                  <span className="font-semibold">{timeline?.vitals?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                  <span>Pain Assessments</span>
                  <span className="font-semibold">{timeline?.painHistory?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CalendarClock size={18} /> Appointment History
          </div>
          {timeline?.sessions?.length ? (
            <DataTable columns={appointmentColumns} data={timeline.sessions} paginate={false} sortable={false} />
          ) : (
            <EmptyState icon={CalendarClock} title="No appointments" message="No appointment history yet." />
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Activity size={18} /> Vitals History
            </div>
            {timeline?.vitals?.length ? (
              <DataTable columns={vitalsColumns} data={timeline.vitals} paginate={false} sortable={false} />
            ) : (
              <EmptyState icon={Activity} title="No vitals" message="No vitals history recorded yet." />
            )}
          </div>

          <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Activity size={18} /> Pain Assessment
              </div>
              <PainReportExport
                patient={{
                  fullName: `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim(),
                  patientId: patient?.patientId || patientId
                }}
                reportRows={painRows}
                timelineRows={painRows}
                containerRef={painPanelRef}
                chartRef={painChartRef}
                notesLabel="Doctor/Nurse Notes"
              />
            </div>
            <div ref={painPanelRef}>
              {(painRows.length || timeline?.painHistory?.length) ? (
                <DataTable
                  columns={painColumns}
                  data={
                    painRows.length
                      ? painRows.map((row) => ({
                          ...row,
                          recordedAt: row.createdAt,
                          painScale: row.intensity,
                          affectedArea: row.region
                        }))
                      : timeline.painHistory
                  }
                  paginate={false}
                  sortable={false}
                />
              ) : (
                <EmptyState icon={Activity} title="No pain assessments" message="No pain history recorded yet." />
              )}
            </div>
            <div className="mt-4" ref={painChartRef}>
              <PainTimelineChart
                rows={(painRows.length ? painRows : timeline?.painHistory || []).map((row) => ({
                  createdAt: row.createdAt || row.recordedAt,
                  region: row.region || row.affectedArea,
                  intensity: Number(row.intensity || row.painScale || 0)
                }))}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Postural Analysis</h3>
            <EmptyState icon={Activity} title="No postural data" message="Postural analysis entries will appear here." />
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Treatment Plans</h3>
            <EmptyState icon={Activity} title="No treatment plans" message="Treatment plan entries will appear here." />
          </div>
        </div>
      </PageWrapper>

      <Modal
        isOpen={editOpen}
        title="Edit Patient Info"
        onClose={() => setEditOpen(false)}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setEditOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          />
          <input
            type="date"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Address Line 1"
            value={form.addressLine1}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Address Line 2"
            value={form.addressLine2}
            onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="State"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Postal Code"
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Emergency Contact Name"
            value={form.emergencyContactName}
            onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Emergency Contact Relationship"
            value={form.emergencyContactRelationship}
            onChange={(e) => setForm({ ...form, emergencyContactRelationship: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Emergency Contact Phone"
            value={form.emergencyContactPhone}
            onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        isOpen={statusModal.open}
        title="Update Appointment Status"
        onClose={() => setStatusModal({ open: false, id: null, status: "CONFIRMED" })}
        footer={
          <>
            <button
              onClick={() => setStatusModal({ open: false, id: null, status: "CONFIRMED" })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={updateAppointmentStatus}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
            >
              Save Status
            </button>
          </>
        }
      >
        <select
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
          value={statusModal.status}
          onChange={(e) => setStatusModal((prev) => ({ ...prev, status: e.target.value }))}
        >
          {appointmentStatusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Modal>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </AdminLayout>
  );
}
