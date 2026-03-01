import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, RotateCcw, Eye } from "lucide-react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import DataTable from "../../../components/admin/DataTable";
import Modal from "../../../components/admin/Modal";
import ConfirmationModal from "../../../components/admin/ConfirmationModal";
import Toast from "../../../components/admin/Toast";
import SearchBar from "../../../components/admin/SearchBar";
import { adminApiExamples } from "../../../services/api.examples";

const glass = "bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20";
const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400";

const PhysiosList = () => {
  const [physios, setPhysios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "General Physiotherapy"
  });

  const specializations = [
    "General Physiotherapy",
    "Sports Injury",
    "Orthopedic",
    "Neurological",
    "Cardiopulmonary",
    "Pediatric",
    "Geriatric",
    "Manual Therapy"
  ];

  useEffect(() => {
    loadPhysios();
  }, [page, pageSize, status, search]);

  const loadPhysios = async () => {
    setLoading(true);
    try {
      const res = await adminApiExamples.getPhysios();
      const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      setPhysios(data);
      setError("");
    } catch (err) {
      setError("Failed to load physiotherapists");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setError("Name, Email, and Phone are required");
      return;
    }
    try {
      const res = await adminApiExamples.createPhysio(formData);
      setMessage(`Physiotherapist created successfully. Temporary password: ${res?.data?.data?.tempPassword || res?.data?.tempPassword}`);
      setShowModal(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        specialization: "General Physiotherapy"
      });
      loadPhysios();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create physiotherapist");
    }
  };

  const handleDelete = async () => {
    try {
      await adminApiExamples.deletePhysio(deleteId);
      setMessage("Physiotherapist deactivated successfully");
      setShowConfirm(false);
      loadPhysios();
    } catch (err) {
      setError("Failed to deactivate physiotherapist");
    }
  };

  const handleResetPassword = async (physioId) => {
    try {
      const res = await adminApiExamples.resetPhysioPassword(physioId);
      setMessage(`Password reset successful. Temporary password: ${res?.data?.data?.tempPassword || res?.data?.tempPassword}`);
      loadPhysios();
    } catch (err) {
      setError("Failed to reset password");
    }
  };

  const columns = [
    {
      header: "Physio ID",
      accessor: "_id",
      render: (val) => <span className="font-semibold text-cyan-700">{val?.slice(-8).toUpperCase() || "-"}</span>
    },
    {
      header: "Name",
      accessor: "name",
      render: (val) => val || "-"
    },
    {
      header: "Email",
      accessor: "email",
      render: (val) => val || "-"
    },
    {
      header: "Phone",
      accessor: "phone",
      render: (val) => val || "-"
    },
    {
      header: "Specialization",
      accessor: "specialization",
      render: (val) => (
        <span className="px-2 py-1 rounded-lg text-xs bg-teal-100 text-teal-700 font-medium">
          {val || "General"}
        </span>
      )
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (val) => (
        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
          val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {val ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (id, row) => (
        <div className="flex gap-2">
          <button onClick={() => {
            setEditingId(id);
            setFormData(row);
            setShowModal(true);
          }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleResetPassword(id)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Reset Password">
            <RotateCcw size={16} />
          </button>
          <button onClick={() => {
            setDeleteId(id);
            setShowConfirm(true);
          }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout
      title="Physiotherapists"
      headerAction={
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: "",
              email: "",
              phone: "",
              specialization: "General Physiotherapy"
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
        >
          <Plus size={18} /> New Physiotherapist
        </button>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <motion.div className={glass + " p-6"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid gap-4 md:grid-cols-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name or email..."
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setPage(1);
              }}
              className={inputClass}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div className={glass + " p-6"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <DataTable columns={columns} data={physios} loading={loading} />
        </motion.div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editingId ? "Edit Physiotherapist" : "New Physiotherapist"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputClass}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputClass}
            />
            <select
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className={inputClass}
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            {!editingId && (
              <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
                A temporary password will be auto-generated and shown after creation
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-700 py-3 font-semibold text-white hover:bg-cyan-800"
            >
              {editingId ? "Update" : "Create"} Physiotherapist
            </button>
          </form>
        </Modal>
      )}

      {/* Confirmation */}
      {showConfirm && (
        <ConfirmationModal
          title="Deactivate Physiotherapist?"
          message="This physiotherapist will be marked as inactive but can be reactivated later."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Messages */}
      {message && <Toast type="success" message={message} onClose={() => setMessage("")} />}
      {error && <Toast type="error" message={error} onClose={() => setError("")} />}
    </DashboardLayout>
  );
};

export default PhysiosList;
