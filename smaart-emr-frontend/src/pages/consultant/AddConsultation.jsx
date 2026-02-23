import { useState } from "react";
import { useParams } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard";
import Button from "../../components/ui/Button";
import ToastAlert from "../../components/dashboard/ToastAlert";
import { addConsultationNote } from "../../services/consultant.service";

export default function AddConsultation() {
  const { patientId } = useParams();
  const [form, setForm] = useState({
    diagnosis: "",
    prescription: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "success", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addConsultationNote(patientId, form);
      setToast({ type: "success", message: "Consultation note saved." });
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || "Unable to save consultation note." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex justify-center">
      <GlassCard className="w-full max-w-3xl">
        <ToastAlert type={toast.type} message={toast.message} />
        <h2 className="text-xl font-bold mb-4">Add Consultation</h2>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <textarea
            value={form.diagnosis}
            placeholder="Diagnosis"
            required
            className="p-3 rounded-xl bg-white/60"
            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
          />
          <textarea
            value={form.prescription}
            placeholder="Prescription"
            required
            className="p-3 rounded-xl bg-white/60"
            onChange={(e) => setForm({ ...form, prescription: e.target.value })}
          />
          <textarea
            value={form.notes}
            placeholder="Notes"
            className="p-3 rounded-xl bg-white/60"
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <Button type="submit">{loading ? "Saving..." : "Save Consultation"}</Button>
        </form>
      </GlassCard>
    </div>
  );
}
