import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { first, formatDateTime, glassCardClass, inputClass, textareaClass, todayIso } from "./nurse.ui";

const affectedAreas = ["Neck", "Shoulder", "Upper Back", "Lower Back", "Hip", "Knee", "Ankle", "General"];
const limitationOptions = ["MILD", "MODERATE", "SEVERE"];

const emptyForm = {
  patientId: "",
  appointmentId: "",
  height: "",
  weight: "",
  bloodPressure: "",
  pulse: "",
  temperature: "",
  oxygenSaturation: "",
  painScale: 5,
  painAffectedArea: "General",
  painNotes: "",
  swelling: false,
  visibleInflammation: "",
  mobilityLimitation: "MILD",
  pastMedicalHistory: "",
  allergies: "",
  currentMedications: "",
  lifestyleFactors: ""
};

export default function VitalsIntake() {
  const [searchParams] = useSearchParams();
  const prePatientId = searchParams.get("patientId") || "";
  const preAppointmentId = searchParams.get("appointmentId") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingReady, setSavingReady] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [vitalsRows, setVitalsRows] = useState([]);
  const [editingVitalsId, setEditingVitalsId] = useState("");
  const [form, setForm] = useState({
    ...emptyForm,
    patientId: prePatientId,
    appointmentId: preAppointmentId
  });

  const bmi = useMemo(() => {
    const h = Number(form.height);
    const w = Number(form.weight);
    if (!h || !w) return "";
    const meters = h / 100;
    const value = w / (meters * meters);
    if (!Number.isFinite(value)) return "";
    return value.toFixed(1);
  }, [form.height, form.weight]);

  const loadAppointments = async () => {
    const data = await nurseDashboardService.getTodayAppointments({ date: todayIso() });
    setAppointments(Array.isArray(data) ? data : []);
  };

  const loadVitals = async (patientRef) => {
    if (!patientRef) {
      setVitalsRows([]);
      return;
    }
    const data = await nurseDashboardService.getPatientVitals(patientRef);
    setVitalsRows(Array.isArray(data) ? data : []);
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      await loadAppointments();
      await loadVitals(form.patientId || prePatientId);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load intake data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (form.patientId) {
      loadVitals(form.patientId);
    }
  }, [form.patientId]);

  const assignedPatients = useMemo(() => {
    const map = new Map();
    appointments.forEach((row) => {
      const patientId = row?.patient?.patientId || row?.patient?._id;
      if (!patientId || map.has(patientId)) return;
      map.set(patientId, {
        patientId,
        patientName: `${first(row?.patient?.firstName, "")} ${first(row?.patient?.lastName, "")}`.trim() || first(row?.patient?.name),
        appointmentId: row._id || row.appointmentId
      });
    });
    return Array.from(map.values());
  }, [appointments]);

  const selectedAppointment = useMemo(
    () => appointments.find((row) => String(row._id || row.appointmentId) === String(form.appointmentId)),
    [appointments, form.appointmentId]
  );

  const patchStatusReady = async () => {
    if (!form.appointmentId) return;
    await nurseDashboardService.updateAppointmentStatus({
      appointmentId: form.appointmentId,
      status: "READY_FOR_PT"
    });
  };

  const submit = async (markReady) => {
    if (!form.patientId) {
      setError("Select patient before saving intake.");
      return;
    }
    setError("");
    setMessage("");
    if (markReady) setSavingReady(true);
    else setSaving(true);

    try {
      const payload = {
        ...form,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        pulse: form.pulse ? Number(form.pulse) : undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        oxygenSaturation: form.oxygenSaturation ? Number(form.oxygenSaturation) : undefined,
        painScale: form.painScale ? Number(form.painScale) : undefined,
        swelling: Boolean(form.swelling),
        allergies: form.allergies
          ? String(form.allergies)
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        mobilityLimitation: form.mobilityLimitation || "MILD",
        markReadyForPT: markReady
      };

      if (editingVitalsId) {
        await nurseDashboardService.updateVitals(editingVitalsId, payload);
      } else {
        await nurseDashboardService.recordVitals(payload);
      }

      if (markReady && form.appointmentId) {
        await patchStatusReady();
      } else if (form.appointmentId) {
        await nurseDashboardService.updateAppointmentStatus({
          appointmentId: form.appointmentId,
          status: "INTAKE_COMPLETED"
        });
      }

      setMessage(markReady ? "Intake successfully completed. Marked as Ready for PT." : "Intake successfully completed.");
      setEditingVitalsId("");
      setForm((prev) => ({
        ...emptyForm,
        patientId: prev.patientId,
        appointmentId: prev.appointmentId
      }));
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to submit intake.");
    } finally {
      setSaving(false);
      setSavingReady(false);
    }
  };

  const editRow = (row) => {
    setEditingVitalsId(row._id || row.id);
    setForm({
      ...emptyForm,
      patientId: row?.patient?.patientId || row?.patient?._id || form.patientId,
      appointmentId: row?.appointment?._id || row?.appointment?.appointmentId || form.appointmentId,
      height: row.height ?? "",
      weight: row.weight ?? "",
      bloodPressure: row.bloodPressure ?? "",
      pulse: row.pulse ?? "",
      temperature: row.temperature ?? "",
      oxygenSaturation: row.oxygenSaturation ?? "",
      painScale: row.painScale ?? 5,
      painAffectedArea: row.painAffectedArea || "General",
      painNotes: row.painNotes || "",
      swelling: Boolean(row.swelling),
      visibleInflammation: row.visibleInflammation || "",
      mobilityLimitation: row.mobilityLimitation || "MILD",
      pastMedicalHistory: row.pastMedicalHistory || "",
      allergies: Array.isArray(row.allergies) ? row.allergies.join(", ") : "",
      currentMedications: row.currentMedications || "",
      lifestyleFactors: row.lifestyleFactors || ""
    });
  };

  const removeRow = async (row) => {
    setError("");
    setMessage("");
    try {
      await nurseDashboardService.deleteVitals(row._id || row.id);
      setMessage("Vitals record deleted.");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete vitals record.");
    }
  };

  return (
    <DashboardLayout title="Vitals & Intake">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className={`${glassCardClass} mb-8`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Nurse Intake Form</h3>
        {loading ? <p className="mb-3 text-sm text-slate-600">Loading intake dependencies...</p> : null}

        <div className="grid gap-3 md:grid-cols-2 mb-3">
          <select
            className={inputClass}
            value={form.patientId}
            onChange={(e) => {
              const pid = e.target.value;
              const match = assignedPatients.find((row) => String(row.patientId) === String(pid));
              setForm((prev) => ({ ...prev, patientId: pid, appointmentId: match?.appointmentId || prev.appointmentId }));
            }}
          >
            <option value="">Select Patient</option>
            {assignedPatients.map((row) => (
              <option key={row.patientId} value={row.patientId}>
                {row.patientId} - {row.patientName}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={form.appointmentId}
            onChange={(e) => setForm((prev) => ({ ...prev, appointmentId: e.target.value }))}
          >
            <option value="">Select Appointment</option>
            {appointments
              .filter((row) => !form.patientId || String(row?.patient?.patientId || row?.patient?._id) === String(form.patientId))
              .map((row) => (
                <option key={row._id || row.appointmentId} value={row._id || row.appointmentId}>
                  {first(row.appointmentId, 'AP-XXXX-XXXX')} - {`${first(row?.patient?.firstName, "")} ${first(row?.patient?.lastName, "")}`.trim() || first(row?.patient?.name)}
                </option>
              ))}
          </select>
        </div>

        {selectedAppointment ? (
          <div className="mb-4 rounded-xl bg-white/35 p-3 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Current Appointment:</span> {first(selectedAppointment?.patient?.patientId)} |{" "}
              {first(selectedAppointment.timeSlot)} | {first(selectedAppointment?.physiotherapist?.name)}
            </p>
            <p>
              Status: <StatusBadge status={first(selectedAppointment.status)} />
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <input className={inputClass} placeholder="Height (cm)" value={form.height} onChange={(e) => setForm((prev) => ({ ...prev, height: e.target.value }))} />
          <input className={inputClass} placeholder="Weight (kg)" value={form.weight} onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))} />
          <input className={inputClass} placeholder="BMI (auto)" value={bmi} readOnly />
          <input className={inputClass} placeholder="Blood Pressure (e.g. 120/80)" value={form.bloodPressure} onChange={(e) => setForm((prev) => ({ ...prev, bloodPressure: e.target.value }))} />
          <input className={inputClass} placeholder="Pulse" value={form.pulse} onChange={(e) => setForm((prev) => ({ ...prev, pulse: e.target.value }))} />
          <input className={inputClass} placeholder="Temperature" value={form.temperature} onChange={(e) => setForm((prev) => ({ ...prev, temperature: e.target.value }))} />
          <input className={inputClass} placeholder="SpO2" value={form.oxygenSaturation} onChange={(e) => setForm((prev) => ({ ...prev, oxygenSaturation: e.target.value }))} />

          <div className="md:col-span-2 rounded-xl bg-white/35 p-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Pain Scale: {form.painScale}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={form.painScale}
              onChange={(e) => setForm((prev) => ({ ...prev, painScale: Number(e.target.value) }))}
              className="mt-2 w-full accent-cyan-600"
            />
          </div>
          <select className={inputClass} value={form.painAffectedArea} onChange={(e) => setForm((prev) => ({ ...prev, painAffectedArea: e.target.value }))}>
            {affectedAreas.map((row) => (
              <option key={row} value={row}>
                {row}
              </option>
            ))}
          </select>
          <textarea className={textareaClass} rows={2} placeholder="Pain notes" value={form.painNotes} onChange={(e) => setForm((prev) => ({ ...prev, painNotes: e.target.value }))} />

          <select className={inputClass} value={form.swelling ? "YES" : "NO"} onChange={(e) => setForm((prev) => ({ ...prev, swelling: e.target.value === "YES" }))}>
            <option value="NO">Swelling: No</option>
            <option value="YES">Swelling: Yes</option>
          </select>
          <input className={inputClass} placeholder="Visible Inflammation" value={form.visibleInflammation} onChange={(e) => setForm((prev) => ({ ...prev, visibleInflammation: e.target.value }))} />
          <select className={inputClass} value={form.mobilityLimitation} onChange={(e) => setForm((prev) => ({ ...prev, mobilityLimitation: e.target.value }))}>
            {limitationOptions.map((row) => (
              <option key={row} value={row}>
                {row}
              </option>
            ))}
          </select>

          <textarea className={textareaClass} rows={2} placeholder="Past medical history" value={form.pastMedicalHistory} onChange={(e) => setForm((prev) => ({ ...prev, pastMedicalHistory: e.target.value }))} />
          <input className={inputClass} placeholder="Allergies (comma separated)" value={form.allergies} onChange={(e) => setForm((prev) => ({ ...prev, allergies: e.target.value }))} />
          <input className={inputClass} placeholder="Current medications" value={form.currentMedications} onChange={(e) => setForm((prev) => ({ ...prev, currentMedications: e.target.value }))} />
          <input className={inputClass} placeholder="Lifestyle factors" value={form.lifestyleFactors} onChange={(e) => setForm((prev) => ({ ...prev, lifestyleFactors: e.target.value }))} />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60"
          >
            {saving ? "Saving..." : editingVitalsId ? "Update Intake" : "Save Intake"}
          </button>
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={savingReady}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:scale-105 disabled:opacity-60"
          >
            {savingReady ? "Processing..." : "Mark as Ready for PT"}
          </button>
          {editingVitalsId ? (
            <button
              type="button"
              onClick={() => {
                setEditingVitalsId("");
                setForm((prev) => ({ ...emptyForm, patientId: prev.patientId, appointmentId: prev.appointmentId }));
              }}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </section>

      <section className={glassCardClass}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Vitals Records (CRUD)</h3>
        <div className="space-y-3">
          {vitalsRows.map((row) => (
            <motion.div key={row._id || row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-white/35 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                {formatDateTime(row.recordedAt || row.createdAt)} | Nurse: {first(row?.recordedBy?.name)} (
                {first(row?.recordedBy?.nurseId || row?.recordedBy?.userId)})
              </p>
              <p>
                BP: {first(row.bloodPressure)} | Pulse: {first(row.pulse)} | Temp: {first(row.temperature)} | SpO2:{" "}
                {first(row.oxygenSaturation)}
              </p>
              <p>
                Pain: {first(row.painScale, 0)}/10 | Area: {first(row.painAffectedArea)} | Swelling: {row.swelling ? "Yes" : "No"}
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => editRow(row)} className="rounded-lg border border-cyan-300 px-3 py-1 text-xs font-semibold text-cyan-700">
                  Edit
                </button>
                <button type="button" onClick={() => removeRow(row)} className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700">
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
          {!vitalsRows.length ? <p className="text-sm text-slate-600">No vitals records for selected patient.</p> : null}
        </div>
      </section>
    </DashboardLayout>
  );
}
