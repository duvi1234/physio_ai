import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, RotateCcw, Trash2, Stethoscope } from "lucide-react";
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

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  specialization: "Physiotherapy",
  experienceYears: 0,
  consultationFee: 0
};

const unwrap = (payload) => payload?.data || payload || {};

export default function Physios() {
  const [loading, setLoading] = useState(true);
  const [physios, setPhysios] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null, active: true });
  const [toast, setToast] = useState(null);

  const loadPhysios = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.physios.list({
        page,
        limit: pageSize,
        search,
        status,
        sortBy: sortField,
        sortOrder: sortDirection
      });
      const data = unwrap(res);
      setPhysios(Array.isArray(data.items) ? data.items : []);
      setPagination(data.pagination || { page, limit: pageSize, total: 0, pages: 1 });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to load physiotherapists." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhysios(1);
  }, [search, status, sortField, sortDirection, pageSize]);

  const onSortChange = ({ field, direction }) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      email: row.email || "",
      phone: row.phone || "",
      specialization: row.specialization || "Physiotherapy",
      experienceYears: row.experienceYears || 0,
      consultationFee: row.consultationFee || 0
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      setToast({ type: "error", message: "Name, email and phone are required." });
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await adminService.physios.update(editingId, form);
        setToast({ type: "success", message: "Physiotherapist updated." });
      } else {
        const res = await adminService.physios.create(form);
        const data = unwrap(res);
        const tempPassword = data?.temporaryPassword || data?.tempPassword;
        setToast({
          type: "success",
          message: tempPassword
            ? `Physio created. Temporary password: ${tempPassword}`
            : "Physio created successfully."
        });
      }
      setModalOpen(false);
      loadPhysios(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (id) => {
    try {
      const res = await adminService.physios.resetPassword(id);
      const data = unwrap(res);
      const tempPassword = data?.tempPassword || data?.temporaryPassword;
      setToast({
        type: "success",
        message: tempPassword ? `Password reset: ${tempPassword}` : "Password reset successful."
      });
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  };

  const handleToggleActive = async () => {
    try {
      setSubmitting(true);
      if (confirm.active) {
        await adminService.physios.delete(confirm.id);
        setToast({ type: "success", message: "Physio deactivated." });
      } else {
        await adminService.physios.activate(confirm.id);
        setToast({ type: "success", message: "Physio activated." });
      }
      setConfirm({ open: false, id: null, active: true });
      loadPhysios(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "physioId",
        label: "Physio ID",
        sortable: true,
        render: (_, row) => (
          <span className="font-semibold text-cyan-700">{row.physioId || row.userId || "-"}</span>
        )
      },
      { key: "name", label: "Name", sortable: true },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      {
        key: "specialization",
        label: "Specialization",
        render: (value) => (
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            {value || "Physiotherapy"}
          </span>
        )
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
              onClick={() => handleEdit(row)}
              className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200 transition"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleResetPassword(row._id)}
              className="rounded-lg bg-purple-100 p-2 text-purple-700 hover:bg-purple-200 transition"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setConfirm({ open: true, id: row._id, active: row.isActive !== false })}
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
    <AdminLayout title="Physiotherapists">
      <PageWrapper>
        <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Physiotherapists</h2>
              <p className="text-sm text-slate-500">{pagination.total} physiotherapists</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
            >
              <Plus size={18} /> Add Physio
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <SearchBar placeholder="Search by name or email..." onSearch={setSearch} onClear={() => setSearch("")} />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <div className="flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">
              <Stethoscope size={14} /> Active workload
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={6} type="table" />
        ) : physios.length ? (
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <DataTable
              columns={columns}
              data={physios}
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
            icon={Stethoscope}
            title="No physiotherapists found"
            message="Create a physiotherapist profile to get started."
            action={{ label: "Create Physio", onClick: handleCreate }}
          />
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(next) => loadPhysios(next)}
        />
      </PageWrapper>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit Physio" : "Create Physio"}
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
              disabled={submitting}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
            >
              {submitting ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Specialization"
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              placeholder="Experience (years)"
              value={form.experienceYears}
              onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Consultation Fee"
              value={form.consultationFee}
              onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={confirm.open}
        title={confirm.active ? "Deactivate Physio?" : "Activate Physio?"}
        message={confirm.active ? "This physio will be marked inactive." : "This physio will be reactivated."}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirm({ open: false, id: null, active: true })}
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
