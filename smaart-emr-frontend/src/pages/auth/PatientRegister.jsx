import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createRequest } from "../../services/request.service";

const initial = {
  fullName: "",
  phone: "",
  email: "",
  gender: "",
  age: "",
  preferredLocation: "",
  preferredDate: "",
  preferredTimeSlot: "09:00 AM - 10:00 AM",
  concernDescription: ""
};

const locations = ["Main Clinic", "North Branch", "South Branch", "East Branch"];
const genders = ["Male", "Female", "Other"];
const timeSlots = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM"
];

const inputClass =
  "w-full rounded-xl border border-slate-400 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200";

export default function PatientRegister() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState({ open: false, requestId: "" });

  const isValid = useMemo(
    () =>
      form.fullName.trim() &&
      form.phone.trim() &&
      form.email.trim() &&
      form.gender &&
      Number(form.age) > 0 &&
      form.preferredLocation &&
      form.preferredDate &&
      form.preferredTimeSlot,
    [form]
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isValid) return;

    setLoading(true);
    try {
      const response = await createRequest({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        department: "Physiotherapy",
        location: form.preferredLocation,
        preferredDate: form.preferredDate,
        preferredTimeSlot: form.preferredTimeSlot,
        description: `Gender: ${form.gender}\nAge: ${form.age}\nConcern: ${form.concernDescription || "-"}`
      });
      const requestId = response?.data?.data?.requestId || "";
      setPopup({ open: true, requestId });
      setForm(initial);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to submit approval request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-xl rounded-2xl border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-md"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Patient Registration Request</h1>
        <p className="mt-1 text-sm text-slate-600">Submit details with your preferred date and time for admin approval.</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Full Name *</label>
            <input name="fullName" value={form.fullName} onChange={onChange} className={inputClass} required />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Phone *</label>
            <input name="phone" value={form.phone} onChange={onChange} className={inputClass} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Email *</label>
            <input name="email" type="email" value={form.email} onChange={onChange} className={inputClass} required />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Gender *</label>
            <select name="gender" value={form.gender} onChange={onChange} className={inputClass} required>
              <option value="">Select Gender</option>
              {genders.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Age *</label>
            <input name="age" type="number" min="1" value={form.age} onChange={onChange} className={inputClass} required />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Preferred Location *</label>
            <select name="preferredLocation" value={form.preferredLocation} onChange={onChange} className={inputClass} required>
              <option value="">Select Location</option>
              {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Preferred Date *</label>
            <input name="preferredDate" type="date" value={form.preferredDate} onChange={onChange} className={inputClass} required />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Preferred Time Slot *</label>
            <select name="preferredTimeSlot" value={form.preferredTimeSlot} onChange={onChange} className={inputClass} required>
              {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Concern Description</label>
            <textarea
              name="concernDescription"
              value={form.concernDescription}
              onChange={onChange}
              rows={4}
              className={inputClass}
            />
          </div>

          {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading || !isValid}
            className="md:col-span-2 w-full rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>

          <p className="md:col-span-2 text-sm text-slate-600">
            Already approved? <Link to="/patient/login" className="font-semibold text-cyan-700">Login</Link>
          </p>
        </form>
      </motion.div>

      {popup.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Request Submitted Successfully</h2>
            <p className="mt-2 text-sm text-slate-700">
              Admin will call you shortly for further process.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Generated Request ID: <span className="font-semibold text-cyan-700">{popup.requestId || "Generated"}</span>
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPopup({ open: false, requestId: "" })}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Close
              </button>
              <Link
                to="/patient/login"
                className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Go to Login
              </Link>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
