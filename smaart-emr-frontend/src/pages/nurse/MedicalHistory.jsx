import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { glassCardClass, inputClass, textareaClass } from "./nurse.ui";

const emptyForm = {
  patientId: "",
  allergies: "",
  chronicConditions: "",
  pastSurgeries: "",
  currentMedications: "",
  lifestyle: ""
};

export default function MedicalHistory() {
  const [form, setForm] = useState(emptyForm);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPatient = async () => {
    if (!form.patientId) return;
    setLoadingPatient(true);
    setError("");
    setMessage("");
    try {
      const row = await nurseDashboardService.getPatient(form.patientId);
      setForm((prev) => ({
        ...prev,
        allergies: Array.isArray(row?.allergies) ? row.allergies.join(", ") : "",
        chronicConditions: Array.isArray(row?.chronicConditions) ? row.chronicConditions.join(", ") : "",
        pastSurgeries: row?.pastSurgeries || "",
        currentMedications: row?.currentMedications || "",
        lifestyle: row?.lifestyle || ""
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to fetch patient medical history.");
    } finally {
      setLoadingPatient(false);
    }
  };

  const saveHistory = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await nurseDashboardService.updateMedicalHistory({
        patientId: form.patientId,
        allergies: form.allergies,
        chronicConditions: form.chronicConditions,
        pastSurgeries: form.pastSurgeries,
        currentMedications: form.currentMedications,
        lifestyle: form.lifestyle
      });
      setMessage("Medical history updated and synced to EMR.");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save medical history.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Medical History">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className={glassCardClass}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Update Patient Medical History</h3>
        <form onSubmit={saveHistory} className="grid gap-3 md:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Patient ID"
            value={form.patientId}
            onChange={(e) => setForm((prev) => ({ ...prev, patientId: e.target.value }))}
            required
          />
          <button
            type="button"
            onClick={loadPatient}
            disabled={loadingPatient || !form.patientId}
            className="rounded-xl border border-cyan-300 px-4 py-3 text-sm font-semibold text-cyan-700 disabled:opacity-60"
          >
            {loadingPatient ? "Loading..." : "Load Current History"}
          </button>

          <input
            className={`${inputClass} md:col-span-2`}
            placeholder="Allergies (comma separated)"
            value={form.allergies}
            onChange={(e) => setForm((prev) => ({ ...prev, allergies: e.target.value }))}
          />
          <input
            className={`${inputClass} md:col-span-2`}
            placeholder="Chronic Conditions (comma separated)"
            value={form.chronicConditions}
            onChange={(e) => setForm((prev) => ({ ...prev, chronicConditions: e.target.value }))}
          />
          <textarea
            className={textareaClass}
            rows={3}
            placeholder="Past surgeries"
            value={form.pastSurgeries}
            onChange={(e) => setForm((prev) => ({ ...prev, pastSurgeries: e.target.value }))}
          />
          <textarea
            className={textareaClass}
            rows={3}
            placeholder="Current medications"
            value={form.currentMedications}
            onChange={(e) => setForm((prev) => ({ ...prev, currentMedications: e.target.value }))}
          />
          <textarea
            className={`${textareaClass} md:col-span-2`}
            rows={3}
            placeholder="Lifestyle notes (smoking, exercise, sleep, etc.)"
            value={form.lifestyle}
            onChange={(e) => setForm((prev) => ({ ...prev, lifestyle: e.target.value }))}
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60 md:col-span-2"
          >
            {saving ? "Saving..." : "Save Medical History"}
          </button>
        </form>
      </section>
    </DashboardLayout>
  );
}
