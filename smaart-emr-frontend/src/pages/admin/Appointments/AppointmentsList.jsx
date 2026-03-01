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

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
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
    patientId: "",
    physiotherapistId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "09:00 AM - 10:00 AM",
    status: "PENDING",
    notes: ""
  });

  const timeSlots = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 01:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
    "05:00 PM - 06:00 PM"
  ];

  useEffect(() => {
    loadAppointments();
  }, [page, pageSize, status, search]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await adminApiExamples.getAppointments(
        { page, limit: pageSize, status: status !== "ALL" ? status : undefined, search }
      );
      const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      setAppointments(data);
      setError("");
    } catch (err) {
      setError("Failed to load appointments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.physiotherapistId) {
      setError("Patient and Physiotherapist are required");
      return;
    }
    try {
      await adminApiExamples.createAppointment(formData);
      setMessage("Appointment created successfully");
      setShowModal(false);
      setFormData({
        patientId: "",
        physiotherapistId: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        timeSlot: "09:00 AM - 10:00 AM",
        status: "PENDING",
        notes: ""
      });
      loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create appointment");
    }
  };

  const handleDelete = async () => {
    try {
      await adminApiExamples.deleteAppointment(deleteId);
      setMessage("Appointment deleted successfully");
      setShowConfirm(false);
      loadAppointments();
    } catch (err) {
      setError("Failed to delete appointment");
    }
  };

  const columns = [
    {
      header: "Appointment ID",
      accessor: "appointmentId",
      render: (val) => <span className="font-semibold text-cyan-700">{val || "-"}</span>
    },
    {
      header: "Patient",
      accessor: "patient",
      render: (patient) => patient?.firstName || "-"
    },
    {
      header: "Physio",
      accessor: "physiotherapist",
      render: (physio) => physio?.name || "-"
    },
    {
      header: "Date",
      accessor: "appointmentDate",
      render: (date) => date ? new Date(date).toLocaleDateString() : "-"
    },
    {
      header: "Time",
      accessor: "timeSlot",
      render: (val) => val || "-"
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => (
        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
          val === "CONFIRMED" ? "bg-green-100 text-green-700" :
          val === "PENDING" ? "bg-yellow-100 text-yellow-700" :
          "bg-red-100 text-red-700"
        }`}>
          {val || "-"}
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
      title="Appointments"
      headerAction={
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              patientId: "",
              physiotherapistId: "",
              appointmentDate: new Date().toISOString().split("T")[0],
              timeSlot: "09:00 AM - 10:00 AM",
              status: "PENDING",
              notes: ""
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
        >
          <Plus size={18} /> New Appointment
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
              placeholder="Search patient or physio..."
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
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
          <DataTable columns={columns} data={appointments} loading={loading} />
        </motion.div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editingId ? "Edit Appointment" : "New Appointment"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Patient ID"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Physiotherapist ID"
              value={formData.physiotherapistId}
              onChange={(e) => setFormData({ ...formData, physiotherapistId: e.target.value })}
              className={inputClass}
            />
            <input
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              className={inputClass}
            />
            <select
              value={formData.timeSlot}
              onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              className={inputClass}
            >
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={inputClass}
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={inputClass + " min-h-24"}
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-700 py-3 font-semibold text-white hover:bg-cyan-800"
            >
              {editingId ? "Update" : "Create"} Appointment
            </button>
          </form>
        </Modal>
      )}

      {/* Confirmation */}
      {showConfirm && (
        <ConfirmationModal
          title="Delete Appointment?"
          message="This appointment will be marked as inactive."
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

export default AppointmentsList;
