import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import ToastAlert from "../../components/dashboard/ToastAlert";
import { createAppointment } from "../../services/appointment.service";

export default function CreateAppointment() {
  const [form, setForm] = useState({
    patientId: "",
    physiotherapistId: "",
    appointmentDate: "",
    timeSlot: "",
    location: "",
    appointmentType: "WALK_IN",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "success", message: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAppointment(form);
      setToast({ type: "success", message: "Appointment confirmed." });
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || "Booking failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex justify-center">
      <GlassCard className="w-full max-w-4xl animate-fadeIn">
        <ToastAlert type={toast.type} message={toast.message} />
        <h2 className="text-2xl font-bold text-indigo-700 mb-6">Book Appointment</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          <Input name="patientId" placeholder="Patient ID" value={form.patientId} onChange={handleChange} />
          <Input name="physiotherapistId" placeholder="Physio User ID or Mongo ID" value={form.physiotherapistId} onChange={handleChange} />
          <Input type="date" name="appointmentDate" value={form.appointmentDate} onChange={handleChange} />
          <Input type="time" name="timeSlot" value={form.timeSlot} onChange={handleChange} />
          <Input name="location" placeholder="Location / Room" value={form.location} onChange={handleChange} />
          <Select name="appointmentType" value={form.appointmentType} onChange={handleChange}>
            <option value="WALK_IN">Walk In</option>
            <option value="VIRTUAL">Virtual</option>
          </Select>
          <textarea
            name="notes"
            value={form.notes}
            placeholder="Consultation Notes"
            onChange={handleChange}
            className="col-span-2 p-3 rounded-xl bg-white/60 backdrop-blur border focus:ring-2 focus:ring-indigo-400 outline-none"
          />
          <div className="col-span-2">
            <Button type="submit">{loading ? "Booking..." : "Confirm Appointment"}</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
