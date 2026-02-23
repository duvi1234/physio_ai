import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import {
  getPatientRecords,
  deleteMedicalRecord
} from "../../services/medicalrecord.service";
import useAuth from "../../hooks/useAuth";
import ToastAlert from "../../components/dashboard/ToastAlert";

export default function PatientMedicalRecords() {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState(user?.patientId || user?.userId || "");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "success", message: "" });

  const fetchRecords = async () => {
    if (!patientId) {
      setToast({ type: "error", message: "Patient ID is required." });
      return;
    }
    setLoading(true);
    try {
      const res = await getPatientRecords(patientId);
      setRecords(res.data.data || []);
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || "Failed to fetch records." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMedicalRecord(id);
      setToast({ type: "success", message: "Record deleted." });
      fetchRecords();
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || "Delete failed." });
    }
  };

  return (
    <div className="p-8">
      <ToastAlert type={toast.type} message={toast.message} />
      <GlassCard className="mb-6">
        <div className="flex gap-4">
          <Input
            placeholder="Enter Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
          <Button onClick={fetchRecords}>{loading ? "Loading..." : "View Records"}</Button>
        </div>
      </GlassCard>

      <div className="grid gap-5">
        {records.map((record) => (
          <GlassCard key={record._id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-indigo-700 text-lg">{record.title}</h3>
                <p className="text-sm text-gray-600">{record.category}</p>
                <p className="text-xs text-gray-500">Uploaded by: {record.uploadedBy?.userId || "-"}</p>
                <p className="mt-2 text-sm">{record.description}</p>
                <p className="mt-2 text-xs text-gray-500">{new Date(record.createdAt).toLocaleString()}</p>
                <a
                  href={record.fileUrl?.startsWith("http") ? record.fileUrl : `http://localhost:5000/${record.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 underline mt-2 block"
                >
                  View File
                </a>
              </div>

              {["ADMIN", "SUPER_ADMIN"].includes(user?.role) ? (
                <Button onClick={() => handleDelete(record._id)} className="bg-red-500 hover:bg-red-600">
                  Delete
                </Button>
              ) : null}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
