import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, RotateCcw, Trash2, Shield } from "lucide-react";
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
  phone: ""
};

const unwrap = (payload) => payload?.data || payload || {};

export default function Nurses() {
  const [loading, setLoading] = useState(true);
  const [nurses, setNurses] = useState([]);
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

  const loadNurses = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.nurses.list({
        page,
        limit: pageSize,
        search,
        status,
        sortBy: sortField,
        sortOrder: sortDirection
      });
      const data = unwrap(res);
      setNurses(Array.isArray(data.items) ? data.items : []);
      setPagination(data.pagination || { page, limit: pageSize, total: 0, pages: 1 });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to load nurses." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNurses(1);
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
      phone: row.phone || ""
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
        await adminService.nurses.update(editingId, form);
        setToast({ type: "success", message: "Nurse updated successfully." });
      } else {
        const res = await adminService.nurses.create(form);
        const data = unwrap(res);
        const tempPassword = data?.temporaryPassword || data?.tempPassword;
        setToast({
          type: "success",
          message: tempPassword
            ? `Nurse created. Temporary password: ${tempPassword}`
            : "Nurse created successfully."
        });
      }
      setModalOpen(false);
      loadNurses(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (id) => {
    try {
      const res = await adminService.nurses.resetPassword(id);
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
        await adminService.nurses.delete(confirm.id);
        setToast({ type: "success", message: "Nurse deactivated." });
      } else {
        await adminService.nurses.activate(confirm.id);
        setToast({ type: "success", message: "Nurse activated." });
      }
      setConfirm({ open: false, id: null, active: true });
      loadNurses(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "nurseId",
        label: "Nurse ID",
        sortable: true,
        render: (_, row) => (
          <span className="font-semibold text-cyan-700">{row.nurseId || row.userId || "-"}</span>
        )
      },
      { key: "name", label: "Name", sortable: true },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
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
    <AdminLayout title="Nurses">
      <PageWrapper>
        <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Nurses</h2>
              <p className="text-sm text-slate-500">{pagination.total} nurses</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
            >
              <Plus size={18} /> Add Nurse
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
              <Shield size={14} /> Admin-only control
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={6} type="table" />
        ) : nurses.length ? (
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <DataTable
              columns={columns}
              data={nurses}
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
            icon={Shield}
            title="No nurses found"
            message="Create a nurse profile to get started."
            action={{ label: "Create Nurse", onClick: handleCreate }}
          />
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(next) => loadNurses(next)}
        />
      </PageWrapper>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit Nurse" : "Create Nurse"}
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
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={confirm.open}
        title={confirm.active ? "Deactivate Nurse?" : "Activate Nurse?"}
        message={confirm.active ? "This nurse will be marked inactive." : "This nurse will be reactivated."}
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
