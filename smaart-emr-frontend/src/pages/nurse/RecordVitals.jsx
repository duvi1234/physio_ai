import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const emptyForm = {
  patientId: "",
  appointmentId: "",
  height: "",
  weight: "",
  bloodPressure: "",
  pulse: "",
  temperature: "",
  oxygenSaturation: "",
  pastMedicalHistory: "",
  pastSurgicalHistory: "",
  allergies: "",
  currentMedications: "",
  lifestyleFactors: ""
};

export default function RecordVitals() {
  const [form, setForm] = useState(emptyForm);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [bmi, setBmi] = useState("");

  const loadAppointments = async () => {
    try {
      const data = await nurseDashboardService.getAssignedPatientSummary(
        new Date().toISOString().split("T")[0]
      );
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setAppointments([]);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (form.height && form.weight) {
      const heightM = Number(form.height) / 100;
      const bmiCalc = Number(form.weight) / (heightM * heightM);
      setBmi(Number.isFinite(bmiCalc) ? bmiCalc.toFixed(2) : "");
    } else {
      setBmi("");
    }
  }, [form.height, form.weight]);

  const assignedPatients = useMemo(() => appointments, [appointments]);

  const selectedAppointment = useMemo(
    () => appointments.find((row) => String(row.appointmentId) === String(form.appointmentId)),
    [appointments, form.appointmentId]
  );

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) {
      setError("Select a patient before recording vitals.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await nurseDashboardService.recordVitals({
        ...form,
        allergies: form.allergies ? form.allergies.split(",").map((a) => a.trim()) : []
      });
      setMessage("Vitals recorded successfully.");
      setForm((prev) => ({ ...emptyForm, patientId: prev.patientId, appointmentId: prev.appointmentId }));
    } catch (err) {
      setError(err?.response?.data?.message || "Error recording vitals.");
    }
  };

  return (
    <DashboardLayout title="Record Vitals">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Patient Vitals</h2>

        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"
            value={form.patientId}
            onChange={(e) => {
              const pid = e.target.value;
              const match = assignedPatients.find((row) => String(row.patientId) === String(pid));
              setForm((prev) => ({
                ...prev,
                patientId: pid,
                appointmentId: match?.appointmentId || prev.appointmentId
              }));
            }}
          >
            <option value="">Select Patient</option>
            {assignedPatients.map((row) => (
              <option key={row.patientId} value={row.patientId}>
                {row.patientId} - {row.patientName || "Patient"}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"
            value={form.appointmentId}
            onChange={(e) => setForm((prev) => ({ ...prev, appointmentId: e.target.value }))}
          >
            <option value="">Select Appointment</option>
            {appointments
              .filter((row) => !form.patientId || String(row.patientId) === String(form.patientId))
              .map((row) => (
                <option key={row.appointmentId} value={row.appointmentId}>
                  {row.appointmentId} - {row.appointmentDate?.split("T")?.[0] || ""}
                </option>
              ))}
          </select>
        </div>

        {selectedAppointment ? (
          <div className="mb-4 rounded-xl bg-cyan-50 px-4 py-3 text-sm text-slate-700">
            Appointment: {selectedAppointment.appointmentId} | Patient: {selectedAppointment.patientId} | Physio: {selectedAppointment.assignedPhysio}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          <Input name="height" type="number" placeholder="Height (cm)" onChange={handleChange} value={form.height} />
          <Input name="weight" type="number" placeholder="Weight (kg)" onChange={handleChange} value={form.weight} />
          <Input name="bloodPressure" placeholder="Blood Pressure (120/80)" onChange={handleChange} value={form.bloodPressure} />
          <Input name="pulse" type="number" placeholder="Pulse (bpm)" onChange={handleChange} value={form.pulse} />
          <Input name="temperature" type="number" placeholder="Temperature (C)" onChange={handleChange} value={form.temperature} />
          <Input name="oxygenSaturation" type="number" placeholder="Oxygen Saturation (%)" onChange={handleChange} value={form.oxygenSaturation} />

          {bmi && (
            <div className="col-span-2 text-sm font-semibold text-cyan-700">
              Calculated BMI: {bmi}
            </div>
          )}

          <textarea
            name="pastMedicalHistory"
            placeholder="Past Medical History"
            onChange={handleChange}
            value={form.pastMedicalHistory}
            className="col-span-2 rounded-xl border border-slate-200 bg-white/60 p-3 text-sm"
          />
          <textarea
            name="pastSurgicalHistory"
            placeholder="Past Surgical History"
            onChange={handleChange}
            value={form.pastSurgicalHistory}
            className="col-span-2 rounded-xl border border-slate-200 bg-white/60 p-3 text-sm"
          />

          <Input name="allergies" placeholder="Allergies (comma separated)" onChange={handleChange} value={form.allergies} />
          <Input name="currentMedications" placeholder="Current Medications" onChange={handleChange} value={form.currentMedications} />
          <textarea
            name="lifestyleFactors"
            placeholder="Lifestyle Factors"
            onChange={handleChange}
            value={form.lifestyleFactors}
            className="col-span-2 rounded-xl border border-slate-200 bg-white/60 p-3 text-sm"
          />

          <div className="col-span-2">
            <Button type="submit">Save Vitals</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
