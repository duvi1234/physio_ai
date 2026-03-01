import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Plus, RotateCcw, Trash2, Eye, Users } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import PageWrapper from "../../components/admin/PageWrapper";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import SearchBar from "../../components/admin/SearchBar";
import Pagination from "../../components/admin/Pagination";
import StatusBadge from "../../components/admin/StatusBadge";
import EmptyState from "../../components/admin/EmptyState";
import LoadingSkeleton from "../../components/admin/LoadingSkeleton";
import { Toast } from "../../components/admin/Toast";
import adminService from "../../services/admin.service";

const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genderOptions = ["Male", "Female", "Other"];

const emptyForm = {
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  bloodGroup: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  assignedPhysio: ""
};

const unwrap = (payload) => payload?.data || payload || {};

export default function Patients() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [assignedPhysio, setAssignedPhysio] = useState("");
  const [todayVisit, setTodayVisit] = useState(false);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [pageSize, setPageSize] = useState(10);
  const [physios, setPhysios] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, data: null });
  const [restoreConfirm, setRestoreConfirm] = useState({ open: false, id: null });
  const [toast, setToast] = useState(null);

  const fetchPhysios = async () => {
    try {
      const res = await adminService.physios.list({ page: 1, limit: 200, status: "active" });
      const data = unwrap(res);
      setPhysios(Array.isArray(data.items) ? data.items : []);
    } catch {
      setPhysios([]);
    }
  };

  const loadPatients = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.patients.list({
        page,
        limit: pageSize,
        search,
        status,
        assignedPhysio: assignedPhysio || undefined,
        todayVisit: todayVisit ? "true" : undefined,
        sortBy: sortField,
        sortOrder: sortDirection
      });
      const data = unwrap(res);
      setPatients(Array.isArray(data.items) ? data.items : []);
      setPagination(data.pagination || { page, limit: pageSize, total: 0, pages: 1 });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to load patients." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhysios();
  }, []);

  useEffect(() => {
    loadPatients(1);
  }, [search, status, assignedPhysio, todayVisit, sortField, sortDirection, pageSize]);

  const onSortChange = ({ field, direction }) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (patient) => {
    setForm({
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      gender: patient.gender || "",
      dateOfBirth: patient.dateOfBirth?.split("T")[0] || "",
      phone: patient.phone || "",
      email: patient.email || "",
      bloodGroup: patient.bloodGroup || "",
      addressLine1: patient.addressLine1 || "",
      addressLine2: patient.addressLine2 || "",
      city: patient.city || "",
      state: patient.state || "",
      postalCode: patient.postalCode || "",
      country: patient.country || "",
      emergencyContactName: patient.emergencyContactName || "",
      emergencyContactRelationship: patient.emergencyContactRelationship || "",
      emergencyContactPhone: patient.emergencyContactPhone || "",
      assignedPhysio: patient.assignedPhysio || ""
    });
    setEditingId(patient._id || patient.patientId);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.gender || !form.dateOfBirth) {
      setToast({ type: "error", message: "Fill all required fields." });
      return;
    }
    if (!form.emergencyContactName || !form.emergencyContactRelationship || !form.emergencyContactPhone) {
      setToast({ type: "error", message: "Emergency contact details required." });
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await adminService.patients.update(editingId, form);
        setToast({ type: "success", message: "Patient updated successfully." });
      } else {
        const res = await adminService.patients.create(form);
        const data = unwrap(res);
        const tempPassword = data?.temporaryPassword || data?.tempPassword;
        setToast({
          type: "success",
          message: tempPassword
            ? `Patient created. Temporary password: ${tempPassword}`
            : "Patient created successfully."
        });
      }
      setModalOpen(false);
      loadPatients(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await adminService.patients.delete(deleteConfirm.id);
      setToast({ type: "success", message: "Patient deactivated." });
      setDeleteConfirm({ open: false, id: null, data: null });
      loadPatients(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    try {
      setSubmitting(true);
      await adminService.patients.activate(restoreConfirm.id);
      setToast({ type: "success", message: "Patient reactivated." });
      setRestoreConfirm({ open: false, id: null });
      loadPatients(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "patientId",
        label: "Patient ID",
        sortable: true,
        render: (value) => <span className="font-semibold text-cyan-700">{value || "-"}</span>
      },
      {
        key: "firstName",
        label: "Name",
        sortable: true,
        render: (_, row) => `${row.firstName || ""} ${row.lastName || ""}`.trim() || "-"
      },
      { key: "phone", label: "Phone", sortable: true },
      { key: "gender", label: "Gender" },
      {
        key: "assignedPhysio",
        label: "Assigned Physio",
        render: (value) => {
          const physio = physios.find((p) => String(p._id) === String(value));
          return physio?.name || physio?.userId || "-";
        }
      },
      {
        key: "isActive",
        label: "Status",
        render: (value) => <StatusBadge status={value === false ? "INACTIVE" : "ACTIVE"} />
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        render: (_, row) => (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/admin/patients/${row.patientId || row._id}`)}
              className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 transition"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => handleEdit(row)}
              className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200 transition"
            >
              <Edit2 size={14} />
            </button>
            {row.isActive !== false ? (
              <button
                onClick={() => setDeleteConfirm({ open: true, id: row._id || row.patientId, data: row })}
                className="rounded-lg bg-rose-100 p-2 text-rose-700 hover:bg-rose-200 transition"
              >
                <Trash2 size={14} />
              </button>
            ) : (
              <button
                onClick={() => setRestoreConfirm({ open: true, id: row._id || row.patientId })}
                className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 transition"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        )
      }
    ],
    [navigate, physios]
  );

  return (
    <AdminLayout title="Patients">
      <PageWrapper>
        <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Patients Management</h2>
              <p className="text-sm text-slate-500">{pagination.total} patients</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
            >
              <Plus size={18} /> Add Patient
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <SearchBar placeholder="Search by ID, name, phone..." onSearch={setSearch} onClear={() => setSearch("")} />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
            <select
              value={assignedPhysio}
              onChange={(e) => setAssignedPhysio(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">All Physiotherapists</option>
              {physios.map((physio) => (
                <option key={physio._id} value={physio._id}>
                  {physio.name || physio.userId}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={todayVisit}
                onChange={(e) => setTodayVisit(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-200"
              />
              <span>Today Visits</span>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={6} type="table" />
        ) : patients.length ? (
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <DataTable
              columns={columns}
              data={patients}
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
            icon={Users}
            title="No patients found"
            message="Start by creating a new patient record."
            action={{ label: "Create Patient", onClick: handleCreate }}
          />
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(next) => loadPatients(next)}
        />
      </PageWrapper>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit Patient" : "Create Patient"}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="First Name *"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="text"
              placeholder="Last Name *"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">Select Gender *</option>
              {genderOptions.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="tel"
              placeholder="Phone Number *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.bloodGroup}
              onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">Select Blood Group</option>
              {bloodGroupOptions.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
            <select
              value={form.assignedPhysio}
              onChange={(e) => setForm({ ...form, assignedPhysio: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="">Assign Physiotherapist</option>
              {physios.map((physio) => (
                <option key={physio._id} value={physio._id}>
                  {physio.name || physio.userId}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Address Line 1"
            value={form.addressLine1}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
          />
          <input
            type="text"
            placeholder="Address Line 2"
            value={form.addressLine2}
            onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="text"
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Postal Code"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="text"
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="mb-3 font-semibold text-slate-900">Emergency Contact *</h4>
            <input
              type="text"
              placeholder="Emergency Contact Name *"
              value={form.emergencyContactName}
              onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              className="mb-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="text"
              placeholder="Relationship *"
              value={form.emergencyContactRelationship}
              onChange={(e) => setForm({ ...form, emergencyContactRelationship: e.target.value })}
              className="mb-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
            <input
              type="tel"
              placeholder="Emergency Phone *"
              value={form.emergencyContactPhone}
              onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
            />
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deleteConfirm.open}
        title="Deactivate Patient?"
        message={`Deactivate ${deleteConfirm.data?.firstName || ""} ${deleteConfirm.data?.lastName || ""}? This can be restored later.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null, data: null })}
        danger
        loading={submitting}
      />

      <ConfirmationModal
        isOpen={restoreConfirm.open}
        title="Reactivate Patient?"
        message="Restore this patient record?"
        onConfirm={handleRestore}
        onCancel={() => setRestoreConfirm({ open: false, id: null })}
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
