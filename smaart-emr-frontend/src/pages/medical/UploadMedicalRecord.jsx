import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { uploadMedicalRecord } from "../../services/medicalrecord.service";
import ToastAlert from "../../components/dashboard/ToastAlert";

export default function UploadMedicalRecord() {
  const [form, setForm] = useState({
    patient: "",
    category: "",
    title: "",
    description: ""
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "success", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setToast({ type: "error", message: "Please select a file." });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("patient", form.patient);
      formData.append("category", form.category);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("file", file);

      await uploadMedicalRecord(formData);
      setToast({ type: "success", message: "Medical record uploaded successfully." });
      setForm({ patient: "", category: "", title: "", description: "" });
      setFile(null);
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || "Upload failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex justify-center">
      <GlassCard className="w-full max-w-4xl animate-fadeIn">
        <ToastAlert type={toast.type} message={toast.message} />
        <h2 className="text-2xl font-bold text-indigo-700 mb-6">Upload Medical Record</h2>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <Input value={form.patient} placeholder="Patient ID" onChange={(e) => setForm({ ...form, patient: e.target.value })} />

          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Select Category</option>
            <option value="XRAY">X-Ray</option>
            <option value="MRI">MRI Scan</option>
            <option value="LAB_REPORT">Lab Report</option>
            <option value="PRESCRIPTION">Prescription</option>
            <option value="DIAGNOSTIC_SUMMARY">Diagnostic Summary</option>
            <option value="OTHER">Other</option>
          </Select>

          <Input value={form.title} placeholder="Record Title" onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <textarea
            value={form.description}
            placeholder="Description"
            className="p-3 rounded-xl bg-white/60 backdrop-blur border"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="border-2 border-dashed border-indigo-300 p-6 rounded-xl text-center bg-white/40 backdrop-blur">
            <input type="file" onChange={(e) => setFile(e.target.files[0] || null)} />
            {file ? <p className="mt-2 text-sm text-gray-600">{file.name}</p> : null}
          </div>

          <Button type="submit">{loading ? "Uploading..." : "Upload Record"}</Button>
        </form>
      </GlassCard>
    </div>
  );
}
