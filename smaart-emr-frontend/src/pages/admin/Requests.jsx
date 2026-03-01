import { useEffect, useMemo, useState } from "react";
import { Check, Edit2, Trash2, X, RotateCcw, ClipboardCheck } from "lucide-react";
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

const approvalDefaults = {
  physiotherapistId: "",
  nurseId: "",
  appointmentDate: new Date().toISOString().split("T")[0],
  timeSlot: "09:00 - 10:00",
  appointmentType: "WALK_IN",
  location: "Main Clinic",
  notes: ""
};

const requestEditDefaults = {
  fullName: "",
  phone: "",
  email: "",
  department: "",
  location: "",
  preferredDate: "",
  preferredTimeSlot: "",
  description: "",
  notes: ""
};

export default function Requests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [physios, setPhysios] = useState([]);
  const [nurses, setNurses] = useState([]);

  const [approveModal, setApproveModal] = useState({ open: false, request: null });
  const [approveForm, setApproveForm] = useState(approvalDefaults);
  const [editModal, setEditModal] = useState({ open: false, request: null });
  const [editForm, setEditForm] = useState(requestEditDefaults);
  const [confirm, setConfirm] = useState({ open: false, id: null, active: true });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadRequests = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.requests.list({
        page,
        limit: pageSize,
        search,
        status: status === "ALL" ? undefined : status
      });
      const data = unwrap(res);
      setRequests(Array.isArray(data.items) ? data.items : []);
      setPagination(data.pagination || { page, limit: pageSize, total: 0, pages: 1 });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to load requests." });
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [physioRes, nurseRes] = await Promise.all([
        adminService.physios.list({ page: 1, limit: 200, status: "active" }),
        adminService.nurses.list({ page: 1, limit: 200, status: "active" })
      ]);
      setPhysios(unwrap(physioRes).items || []);
      setNurses(unwrap(nurseRes).items || []);
    } catch {
      setPhysios([]);
      setNurses([]);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadRequests(1);
  }, [search, status, pageSize]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approveForm.physiotherapistId) {
      setToast({ type: "error", message: "Select a physiotherapist to approve." });
      return;
    }
    try {
      setSubmitting(true);
      await adminService.requests.approve(approveModal.request.requestId, approveForm);
      setToast({ type: "success", message: "Request approved and appointment created." });
      setApproveModal({ open: false, request: null });
      setApproveForm(approvalDefaults);
      loadRequests(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setSubmitting(true);
      await adminService.requests.reject(id);
      setToast({ type: "success", message: "Request rejected." });
      loadRequests(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setSubmitting(true);
      if (confirm.active) {
        await adminService.requests.delete(confirm.id);
        setToast({ type: "success", message: "Request deactivated." });
      } else {
        await adminService.requests.activate(confirm.id);
        setToast({ type: "success", message: "Request activated." });
      }
      setConfirm({ open: false, id: null, active: true });
      loadRequests(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row) => {
    setEditModal({ open: true, request: row });
    setEditForm({
      fullName: row.fullName || "",
      phone: row.phone || "",
      email: row.email || "",
      department: row.department || "",
      location: row.location || "",
      preferredDate: row.preferredDate ? row.preferredDate.split("T")[0] : "",
      preferredTimeSlot: row.preferredTimeSlot || "",
      description: row.description || "",
      notes: row.notes || ""
    });
  };

  const handleUpdateRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminService.requests.update(editModal.request.requestId || editModal.request._id, editForm);
      setToast({ type: "success", message: "Request updated." });
      setEditModal({ open: false, request: null });
      loadRequests(pagination.page);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "requestId",
        label: "Request ID",
        render: (value) => <span className="font-semibold text-cyan-700">{value || "-"}</span>
      },
      { key: "fullName", label: "Name" },
      { key: "phone", label: "Phone" },
      {
        key: "preferredDate",
        label: "Preferred Date",
        render: (value) => (value ? new Date(value).toLocaleDateString() : "-")
      },
      {
        key: "status",
        label: "Status",
        render: (value) => <StatusBadge status={value || "PENDING"} />
      },
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <div className="flex gap-2">
            {row.status === "PENDING" && (
              <>
                <button
                  onClick={() => {
                    setApproveModal({ open: true, request: row });
                    setApproveForm(approvalDefaults);
                  }}
                  className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 transition"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => handleReject(row.requestId)}
                  className="rounded-lg bg-amber-100 p-2 text-amber-700 hover:bg-amber-200 transition"
                >
                  <X size={14} />
                </button>
              </>
            )}
            <button
              onClick={() => openEdit(row)}
              className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200 transition"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => setConfirm({ open: true, id: row.requestId || row._id, active: row.isActive !== false })}
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
    <AdminLayout title="Requests">
      <PageWrapper>
        <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Appointment Requests</h2>
              <p className="text-sm text-slate-500">{pagination.total} requests</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">
              <ClipboardCheck size={14} /> Review queue
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <SearchBar placeholder="Search by name or phone..." onSearch={setSearch} onClear={() => setSearch("")} />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CONTACTED">Contacted</option>
              <option value="CONVERTED">Converted</option>
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
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={6} type="table" />
        ) : requests.length ? (
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <DataTable columns={columns} data={requests} paginate={false} sortable={false} />
          </div>
        ) : (
          <EmptyState icon={ClipboardCheck} title="No requests" message="New appointment requests will appear here." />
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(next) => loadRequests(next)}
        />
      </PageWrapper>

      <Modal
        isOpen={approveModal.open}
        title="Approve Request"
        onClose={() => setApproveModal({ open: false, request: null })}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setApproveModal({ open: false, request: null })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              {submitting ? "Approving..." : "Approve & Create Appointment"}
            </button>
          </>
        }
      >
        {approveModal.request ? (
          <form className="space-y-4">
            <div className="rounded-xl bg-cyan-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{approveModal.request.fullName}</p>
              <p>{approveModal.request.phone}</p>
              <p>{approveModal.request.location}</p>
            </div>
            <select
              value={approveForm.physiotherapistId}
              onChange={(e) => setApproveForm({ ...approveForm, physiotherapistId: e.target.value })}
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
              value={approveForm.nurseId}
              onChange={(e) => setApproveForm({ ...approveForm, nurseId: e.target.value })}
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
                value={approveForm.appointmentDate}
                onChange={(e) => setApproveForm({ ...approveForm, appointmentDate: e.target.value })}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              />
              <input
                type="text"
                value={approveForm.timeSlot}
                onChange={(e) => setApproveForm({ ...approveForm, timeSlot: e.target.value })}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                placeholder="Time slot"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={approveForm.location}
                onChange={(e) => setApproveForm({ ...approveForm, location: e.target.value })}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                placeholder="Location"
              />
              <select
                value={approveForm.appointmentType}
                onChange={(e) => setApproveForm({ ...approveForm, appointmentType: e.target.value })}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                <option value="WALK_IN">Walk-in</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
            <textarea
              rows={3}
              value={approveForm.notes}
              onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
              placeholder="Notes"
            />
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={editModal.open}
        title="Edit Request"
        onClose={() => setEditModal({ open: false, request: null })}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setEditModal({ open: false, request: null })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRequest}
              disabled={submitting}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <form className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Full Name"
            value={editForm.fullName}
            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Department"
            value={editForm.department}
            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Location"
            value={editForm.location}
            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
          />
          <input
            type="date"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            value={editForm.preferredDate}
            onChange={(e) => setEditForm({ ...editForm, preferredDate: e.target.value })}
          />
          <input
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Preferred Time Slot"
            value={editForm.preferredTimeSlot}
            onChange={(e) => setEditForm({ ...editForm, preferredTimeSlot: e.target.value })}
          />
          <textarea
            rows={3}
            className="md:col-span-2 rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
          <textarea
            rows={2}
            className="md:col-span-2 rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Notes"
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          />
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={confirm.open}
        title={confirm.active ? "Deactivate Request?" : "Activate Request?"}
        message={confirm.active ? "This request will be marked inactive." : "This request will be restored."}
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
