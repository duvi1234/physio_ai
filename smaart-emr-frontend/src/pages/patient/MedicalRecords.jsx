import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Trash2, UploadCloud } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import patientDashboardService, { toAssetUrl } from "../../services/patient.dashboard.service";
import { cardTitleClass, first, formatDateTime, glassCardClass, inputClass, sectionMutedClass } from "./patient.ui";

const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const maxSize = 10 * 1024 * 1024;

const categories = [
  { value: "MRI", label: "MRI" },
  { value: "XRAY", label: "X-ray" },
  { value: "LAB_REPORT", label: "Lab Report" },
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "DIAGNOSTIC_SUMMARY", label: "Diagnostic Summary" },
  { value: "OTHER", label: "Other" }
];

export default function MedicalRecords() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [records, setRecords] = useState([]);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("MRI");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const identity = patientDashboardService.getPatientIdentity();
      const patientRef = identity.patientId || identity.mongoId;
      const rows = await patientDashboardService.getMedicalRecords(patientRef);
      setRecords(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const submitUpload = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Allowed: PDF, JPG, PNG.");
      return;
    }
    if (file.size > maxSize) {
      setError("File size exceeds 10MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("title", title || `${category} Upload`);
      formData.append("description", "Uploaded from patient dashboard");
      await patientDashboardService.uploadMedicalRecord(formData);
      setMessage("Medical record uploaded successfully.");
      setFile(null);
      setTitle("");
      await loadRecords();
    } catch (err) {
      setError(err?.response?.data?.message || "Medical record upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const deleteRecord = async (row) => {
    setError("");
    setMessage("");
    try {
      await patientDashboardService.deleteMedicalRecord(row._id || row.id);
      setMessage("Record deleted successfully.");
      await loadRecords();
    } catch (err) {
      setError(err?.response?.data?.message || "Delete permission denied for this record.");
    }
  };

  return (
    <DashboardLayout title="Medical Records">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className={`${glassCardClass} mb-8`}>
        <div className="mb-4 flex items-center gap-2">
          <UploadCloud size={18} className="text-cyan-700" />
          <h3 className={cardTitleClass}>Upload Medical Files</h3>
        </div>
        <form onSubmit={submitUpload} className="grid gap-3 md:grid-cols-2">
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((row) => (
              <option key={row.value} value={row.value}>
                {row.label}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Record title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="file"
            className={`${inputClass} md:col-span-2`}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <button
            type="submit"
            disabled={uploading}
            className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60 md:col-span-2"
          >
            {uploading ? "Uploading..." : "Upload Record"}
          </button>
        </form>
      </section>

      <section className={glassCardClass}>
        <h3 className={`${cardTitleClass} mb-4`}>Uploaded Records</h3>
        {loading ? <p className={sectionMutedClass}>Loading records...</p> : null}
        {!loading && !records.length ? <p className={sectionMutedClass}>No records uploaded.</p> : null}
        <div className="space-y-3">
          {records.map((row) => (
            <motion.div
              key={row._id || row.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-white/35 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{first(row.title || row.fileName || row.originalName)}</p>
                  <p>Category: {first(row.category || row.recordType)}</p>
                  <p>Upload Date: {formatDateTime(row.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={toAssetUrl(row.fileUrl || row.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <Download size={14} />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteRecord(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700"
                  >
                    <Trash2 size={14} />
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
