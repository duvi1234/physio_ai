import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Edit2, Plus, RotateCcw, Trash2 } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import PageWrapper from "../../components/admin/PageWrapper";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import SearchBar from "../../components/admin/SearchBar";
import Pagination from "../../components/admin/Pagination";
import StatusBadge from "../../components/admin/StatusBadge";
import LoadingSkeleton from "../../components/admin/LoadingSkeleton";
import EmptyState from "../../components/admin/EmptyState";
import { Toast } from "../../components/admin/Toast";
import adminService from "../../services/admin.service";

const unwrap = (payload) => payload?.data || payload || {};

const timeSlots = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00"
];

const emptyForm = {
  patientId: "",
  physiotherapistId: "",
  nurseId: "",
  appointmentDate: new Date().toISOString().split("T")[0],
  timeSlot: timeSlots[1],
  location: "Main Clinic",
  appointmentType: "WALK_IN",
  status: "CONFIRMED",
  notes: ""
};

const statusOptions = [
  "PENDING",
  "CONFIRMED",
  "ARRIVED",
  "INTAKE_COMPLETED",
  "READY_FOR_PT",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW"
];

export default function Appointments() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [isActive, setIsActive] = useState(true);
  const [sortField, setSortField] = useState("appointmentDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [pageSize, setPageSize] = useState(10);

  const [patients, setPatients] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [nurses, setNurses] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, active: true });
  const [toast, setToast] = useState(null);

  const loadLookups = async () => {
    try {
      const [patientRes, physioRes, nurseRes] = await Promise.all([
        adminService.patients.list({ page: 1, limit: 200, status: "active" }),
        adminService.physios.list({ page: 1, limit: 200, status: "active" }),
        adminService.nurses.list({ page: 1, limit: 200, status: "active" })
      ]);
      setPatients(unwrap(patientRes).items || []);
      setPhysios(unwrap(physioRes).items || []);
      setNurses(unwrap(nurseRes).items || []);
    } catch {
      setPatients([]);
      setPhysios([]);
      setNurses([]);
    }
  };

  const loadAppointments = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.appointments.list({
        page,
        limit: pageSize,
        search,
        status: status === "ALL" ? undefined : status,
        isActive,
        sortBy: sortField,
        sortOrder: sortDirection
      });
      const data = unwrap(res);
      setAppointments(Array.isArray(data.items) ? data.items : []);
      setPagination(data.pagination || { page, limit: pageSize, total: 0, pages: 1 });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to load appointments." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadAppointments(1);
  }, [search, status, isActive, sortField, sortDirection, pageSize]);

  const onSortChange = ({ field, direction }) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditingId(row._id || row.appointmentId);
    setForm({
      patientId: row?.patient?.patientId || row?.patient?._id || "",
      physiotherapistId: row?.physiotherapist?._id || row?.physiotherapist?.userId || "",
      nurseId: row?.assignedTo?._id || row?.assignedTo?.userId || "",
      appointmentDate: row.appointmentDate ? row.appointmentDate.split("T")[0] : "",
      timeSlot: row.timeSlot || timeSlots[0],
      location: row.location || "Main Clinic",
      appointmentType: row.appointmentType || "WALK_IN",
      status: row.status || "CONFIRMED",
      notes: row.notes || ""
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.physiotherapistId || !form.appointmentDate || !form.timeSlot) {
      setToast({ type: "error", message: "Patient, physiotherapist, date and time are required." });
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await adminService.appointments.update(editingId, form);
        setToast({ type: "success", message: "Appointment updated." });
      } else {
        await adminService.appointments.create(form);
        setToast({ type: "success", message: "Appointment created." });
      }
      setModalOpen(false);
      loadAppointments(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      if (deleteConfirm.active) {
        await adminService.appointments.delete(deleteConfirm.id);
        setToast({ type: "success", message: "Appointment deactivated." });
      } else {
        await adminService.appointments.activate(deleteConfirm.id);
        setToast({ type: "success", message: "Appointment reactivated." });
      }
      setDeleteConfirm({ open: false, id: null, active: true });
      loadAppointments(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "appointmentId",
        label: "Appointment ID",
        sortable: true,
        render: (value) => <span className="font-semibold text-cyan-700">{value || "-"}</span>
      },
      {
        key: "patient",
        label: "Patient",
        render: (_, row) =>
          `${row?.patient?.firstName || ""} ${row?.patient?.lastName || ""}`.trim() ||
          row?.patient?.patientId ||
          "-"
      },
      {
        key: "physiotherapist",
        label: "Physio",
        render: (_, row) => row?.physiotherapist?.name || row?.physiotherapist?.userId || "-"
      },
      {
        key: "appointmentDate",
        label: "Date",
        sortable: true,
        render: (value) => (value ? new Date(value).toLocaleDateString() : "-")
      },
      { key: "timeSlot", label: "Time" },
      {
        key: "status",
        label: "Status",
        render: (value) => <StatusBadge status={value} />
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        render: (_, row) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(row)}
              className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200 transition"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() =>
                setDeleteConfirm({ open: true, id: row._id || row.appointmentId, active: row.isActive !== false })
              }
              className={`rounded-lg p-2 transition ${
                row.isActive !== false
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              {row.isActive !== false ? <Trash2 size={14} /> : <RotateCcw size={14} />}
            </button>
          </div>
        )
      }
    ],
    []
  );

  return (
    <AdminLayout title="Appointments">
      <PageWrapper>
        <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Appointment Management</h2>
              <p className="text-sm text-slate-500">{pagination.total} appointments</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
            >
              <Plus size={18} /> New Appointment
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <SearchBar placeholder="Search by patient or ID..." onSearch={setSearch} onClear={() => setSearch("")} />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={isActive ? "active" : "inactive"}
              onChange={(e) => setIsActive(e.target.value === "active")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={6} type="table" />
        ) : appointments.length ? (
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <DataTable
              columns={columns}
              data={appointments}
              sortable
              manualSort
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
              paginate={false}
            />
          </div>
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="No appointments found"
            message="Schedule a new appointment to get started."
            action={{ label: "Create Appointment", onClick: handleCreate }}
          />
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(next) => loadAppointments(next)}
        />
      </PageWrapper>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit Appointment" : "Create Appointment"}
        onClose={() => setModalOpen(false)}
        size="lg"
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
              disabled={submitting}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
            >
              {submitting ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <select
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            <option value="">Select Patient</option>
            {patients.map((patient) => (
              <option key={patient._id} value={patient.patientId || patient._id}>
                {patient.patientId} - {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>

          <select
            value={form.physiotherapistId}
            onChange={(e) => setForm({ ...form, physiotherapistId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            <option value="">Select Physiotherapist</option>
            {physios.map((physio) => (
              <option key={physio._id} value={physio._id}>
                {physio.physioId || physio.userId} - {physio.name}
              </option>
            ))}
          </select>

          <select
            value={form.nurseId}
            onChange={(e) => setForm({ ...form, nurseId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            <option value="">Assign Nurse (optional)</option>
            {nurses.map((nurse) => (
              <option key={nurse._id} value={nurse._id}>
                {nurse.nurseId || nurse.userId} - {nurse.name}
              </option>
            ))}
          </select>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="date"
              value={form.appointmentDate}
              onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
            <select
              value={form.timeSlot}
              onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Location"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.appointmentType}
              onChange={(e) => setForm({ ...form, appointmentType: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              <option value="WALK_IN">Walk-in</option>
              <option value="VIRTUAL">Virtual</option>
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Notes"
          />
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deleteConfirm.open}
        title={deleteConfirm.active ? "Deactivate Appointment?" : "Reactivate Appointment?"}
        message={
          deleteConfirm.active
            ? "This appointment will be marked inactive."
            : "This appointment will be restored."
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null, active: true })}
        loading={submitting}
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </AdminLayout>
  );
}
