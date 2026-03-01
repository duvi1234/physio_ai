import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, Eye } from "lucide-react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import DataTable from "../../../components/admin/DataTable";
import Modal from "../../../components/admin/Modal";
import ConfirmationModal from "../../../components/admin/ConfirmationModal";
import Toast from "../../../components/admin/Toast";
import SearchBar from "../../../components/admin/SearchBar";
import { adminApiExamples } from "../../../services/api.examples";

const glass = "bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20";
const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400";

const RequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [approvalData, setApprovalData] = useState({
    physiotherapistId: "",
    nurseId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "09:00 AM - 10:00 AM"
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
    loadRequests();
    loadConsultants();
    loadNurses();
  }, [page, pageSize, status, search]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await adminApiExamples.getAppointmentRequests();
      const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      let filtered = data;
      if (status !== "ALL") {
        filtered = data.filter(r => r.status === status);
      }
      setRequests(filtered);
      setError("");
    } catch (err) {
      setError("Failed to load requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadConsultants = async () => {
    try {
      const res = await adminApiExamples.getConsultants();
      const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      setConsultants(data);
    } catch (err) {
      console.error("Failed to load consultants", err);
    }
  };

  const loadNurses = async () => {
    try {
      const res = await adminApiExamples.getNurses();
      const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      setNurses(data);
    } catch (err) {
      console.error("Failed to load nurses", err);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approvalData.physiotherapistId) {
      setError("Please select a physiotherapist");
      return;
    }
    try {
      await adminApiExamples.approveRequest(selectedRequest._id, approvalData);
      setMessage("Request approved and appointment created successfully");
      setShowApproveModal(false);
      setApprovalData({
        physiotherapistId: "",
        nurseId: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        timeSlot: "09:00 AM - 10:00 AM"
      });
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await adminApiExamples.rejectRequest(requestId);
      setMessage("Request rejected successfully");
      loadRequests();
    } catch (err) {
      setError("Failed to reject request");
    }
  };

  const handleDelete = async () => {
    try {
      await adminApiExamples.deleteRequest(deleteId);
      setMessage("Request deleted successfully");
      setShowConfirm(false);
      loadRequests();
    } catch (err) {
      setError("Failed to delete request");
    }
  };

  const columns = [
    {
      header: "Request ID",
      accessor: "_id",
      render: (val) => <span className="font-semibold text-cyan-700">{val?.slice(-8).toUpperCase() || "-"}</span>
    },
    {
      header: "Full Name",
      accessor: "fullName",
      render: (val) => val || "-"
    },
    {
      header: "Phone",
      accessor: "phone",
      render: (val) => val || "-"
    },
    {
      header: "Preferred Date",
      accessor: "preferredDate",
      render: (date) => date ? new Date(date).toLocaleDateString() : "-"
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => (
        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
          val === "PENDING" ? "bg-yellow-100 text-yellow-700" :
          val === "APPROVED" ? "bg-green-100 text-green-700" :
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
          {row.status === "PENDING" && (
            <>
              <button onClick={() => {
                setSelectedRequest(row);
                setShowApproveModal(true);
              }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                <Check size={16} />
              </button>
              <button onClick={() => handleReject(id)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Reject">
                <X size={16} />
              </button>
            </>
          )}
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
      title="Appointment Requests"
    >
      <div className="space-y-6">
        {/* Filters */}
        <motion.div className={glass + " p-6"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid gap-4 md:grid-cols-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name or phone..."
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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
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
          <DataTable columns={columns} data={requests} loading={loading} />
        </motion.div>
      </div>

      {/* Approval Modal */}
      {showApproveModal && selectedRequest && (
        <Modal title="Approve Appointment Request" onClose={() => setShowApproveModal(false)}>
          <form onSubmit={handleApprove} className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-slate-700">
                <span className="font-semibold">Applicant:</span> {selectedRequest.fullName}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Phone:</span> {selectedRequest.phone}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assign Physiotherapist *
              </label>
              <select
                value={approvalData.physiotherapistId}
                onChange={(e) => setApprovalData({ ...approvalData, physiotherapistId: e.target.value })}
                className={inputClass}
              >
                <option value="">Select a physiotherapist</option>
                {consultants.map(consultant => (
                  <option key={consultant._id} value={consultant._id}>
                    {consultant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assign Nurse (Optional)
              </label>
              <select
                value={approvalData.nurseId}
                onChange={(e) => setApprovalData({ ...approvalData, nurseId: e.target.value })}
                className={inputClass}
              >
                <option value="">No nurse assigned</option>
                {nurses.map(nurse => (
                  <option key={nurse._id} value={nurse._id}>
                    {nurse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Appointment Date
              </label>
              <input
                type="date"
                value={approvalData.appointmentDate}
                onChange={(e) => setApprovalData({ ...approvalData, appointmentDate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time Slot
              </label>
              <select
                value={approvalData.timeSlot}
                onChange={(e) => setApprovalData({ ...approvalData, timeSlot: e.target.value })}
                className={inputClass}
              >
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
              >
                Approve & Create Appointment
              </button>
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="flex-1 rounded-xl bg-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation */}
      {showConfirm && (
        <ConfirmationModal
          title="Delete Request?"
          message="This request will be permanently deleted."
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

export default RequestsList;
