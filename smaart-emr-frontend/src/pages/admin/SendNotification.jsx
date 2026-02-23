import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import ToastAlert from "../../components/dashboard/ToastAlert";

export default function SendNotification() {
  const [form, setForm] = useState({
    phone: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "success", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/notifications", form);
      setToast({ type: "success", message: "Notification sent successfully." });
      setForm({ phone: "", email: "", subject: "", message: "" });
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || "Failed to send notification." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex justify-center">
      <GlassCard className="w-full max-w-2xl">
        <ToastAlert type={toast.type} message={toast.message} />
        <h2 className="text-xl font-bold text-slate-900 mb-4">Send Custom Notification</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="phone" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input name="email" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input name="subject" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea
            name="message"
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-xl border border-white/50 bg-white/60 p-3 outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Button type="submit">{loading ? "Sending..." : "Send Notification"}</Button>
        </form>
      </GlassCard>
    </div>
  );
}
