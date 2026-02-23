import { useState } from "react";
import { createRequest } from "../../services/request.service";

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  department: "Physiotherapy",
  location: "",
  preferredDate: "",
  preferredTimeSlot: "",
  description: ""
};

export default function AppointmentRequestForm() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await createRequest(form);
      setMessage("Appointment request submitted successfully.");
      setForm(initialForm);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to submit appointment request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-md">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Request Appointment</h1>
        <p className="mt-2 text-sm text-slate-600">Public booking request form for patient onboarding.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ["fullName", "Full Name", "text"],
            ["phone", "Phone", "text"],
            ["email", "Email", "email"],
            ["location", "Location", "text"],
            ["preferredDate", "Preferred Date", "date"],
            ["preferredTimeSlot", "Preferred Time Slot", "text"]
          ].map(([name, label, type]) => (
            <div key={name}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</label>
              <input
                type={type}
                value={form[name]}
                onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))}
                required={name !== "email"}
                className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Department</label>
            <select
              value={form.department}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none"
            >
              <option>Physiotherapy</option>
              <option>Orthopedics</option>
              <option>Cardiology</option>
              <option>Neurology</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Concern</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none"
            />
          </div>

          {message ? <p className="md:col-span-2 text-sm text-slate-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
          >
            {loading ? "Submitting..." : "Submit Appointment Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
