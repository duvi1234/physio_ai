import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Trash2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { toAssetUrl } from "../../services/patient.dashboard.service";
import { first, formatDateTime, glassCardClass, inputClass, sectionMutedClass } from "./nurse.ui";

const categories = [
  { value: "MRI", label: "MRI" },
  { value: "XRAY", label: "X-ray" },
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "LAB_REPORT", label: "Reports" },
  { value: "OTHER", label: "Other" }
];

const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const maxSize = 10 * 1024 * 1024;

export default function UploadDocuments() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [patientId, setPatientId] = useState("");
  const [category, setCategory] = useState("MRI");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [records, setRecords] = useState([]);

  const loadRecords = async () => {
    if (!patientId) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const rows = await nurseDashboardService.getMedicalRecords(patientId);
      setRecords(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const upload = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!patientId) {
      setError("Patient ID is required.");
      return;
    }
    if (!file) {
      setError("Choose a file before upload.");
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only PDF, JPG, PNG allowed.");
      return;
    }
    if (file.size > maxSize) {
      setError("File exceeds 10MB limit.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("patientId", patientId);
      formData.append("patient", patientId);
      formData.append("category", category);
      formData.append("title", title || `${category} Upload`);
      formData.append("file", file);
      await nurseDashboardService.uploadMedicalRecord(formData);
      setFile(null);
      setTitle("");
      setMessage("Document uploaded successfully.");
      await loadRecords();
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const deleteRecord = async (row) => {
    setError("");
    setMessage("");
    try {
      await nurseDashboardService.deleteMedicalRecord(row._id || row.id);
      setMessage("Document deleted successfully.");
      await loadRecords();
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <DashboardLayout title="Upload Documents">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className={`${glassCardClass} mb-8`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Document Upload</h3>
        <form onSubmit={upload} className="grid gap-3 md:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={loadRecords}
            disabled={!patientId || loading}
            className="rounded-xl border border-cyan-300 px-4 py-3 text-sm font-semibold text-cyan-700 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Load Existing Files"}
          </button>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((row) => (
              <option key={row.value} value={row.value}>
                {row.label}
              </option>
            ))}
          </select>
          <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input
            type="file"
            className={`${inputClass} md:col-span-2`}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            type="submit"
            disabled={uploading}
            className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60 md:col-span-2"
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </section>

      <section className={glassCardClass}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Uploaded Documents</h3>
        {!records.length ? <p className={sectionMutedClass}>No uploaded documents found.</p> : null}
        <div className="space-y-3">
          {records.map((row) => (
            <motion.div key={row._id || row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{first(row.title || row.fileName || row.originalName)}</p>
                  <p>Category: {first(row.category || row.recordType)}</p>
                  <p>Uploaded: {formatDateTime(row.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={toAssetUrl(row.fileUrl || row.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <Download size={13} />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteRecord(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
