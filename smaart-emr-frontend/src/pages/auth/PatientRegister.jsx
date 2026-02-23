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
  concernDescription: ""
};

const locations = ["Main Clinic", "North Branch", "South Branch", "East Branch"];
const genders = ["Male", "Female", "Other"];

export default function PatientRegister() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isValid = useMemo(
    () =>
      form.fullName.trim() &&
      form.phone.trim() &&
      form.email.trim() &&
      form.gender &&
      Number(form.age) > 0 &&
      form.preferredLocation,
    [form]
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isValid) return;

    setLoading(true);
    try {
      const response = await createRequest({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        department: "Physiotherapy",
        location: form.preferredLocation,
        description: `Gender: ${form.gender}\nAge: ${form.age}\nConcern: ${form.concernDescription || "-"}`,
        preferredDate: null,
        preferredTimeSlot: null
      });
      const requestId = response?.data?.data?.requestId;
      setSuccess(`Request submitted for admin approval. Temporary Request ID: ${requestId || "Generated"}`);
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
        <p className="mt-1 text-sm text-slate-600">Submit your details for admin approval and appointment scheduling.</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Full Name *</label>
            <input name="fullName" value={form.fullName} onChange={onChange} className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none" required />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Phone *</label>
            <input name="phone" value={form.phone} onChange={onChange} className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Email *</label>
            <input name="email" type="email" value={form.email} onChange={onChange} className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none" required />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Gender *</label>
            <select name="gender" value={form.gender} onChange={onChange} className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none" required>
              <option value="">Select Gender</option>
              {genders.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Age *</label>
            <input name="age" type="number" min="1" value={form.age} onChange={onChange} className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none" required />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Preferred Location *</label>
            <select name="preferredLocation" value={form.preferredLocation} onChange={onChange} className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none" required>
              <option value="">Select Location</option>
              {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Concern Description</label>
            <textarea
              name="concernDescription"
              value={form.concernDescription}
              onChange={onChange}
              rows={4}
              className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none"
            />
          </div>

          {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}
          {success ? <p className="md:col-span-2 text-sm text-emerald-700">{success}</p> : null}

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
    </div>
  );
}
