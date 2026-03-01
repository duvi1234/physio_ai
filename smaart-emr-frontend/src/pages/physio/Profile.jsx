import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageWrapper from "../../components/dashboard/PageWrapper";
import ToastAlert from "../../components/dashboard/ToastAlert";
import physioService from "../../services/physio.service";
import useAuth from "../../hooks/useAuth";
import { inputClass } from "../nurse/nurse.ui";

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || ""
  });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || ""
    });
  }, [user]);

  const save = async () => {
    setLoading(true);
    try {
      await physioService.updateProfile(form);
      setToast({ type: "success", message: "Profile updated." });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to update profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Profile">
      <PageWrapper>
        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              className={inputClass}
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={save}
              disabled={loading}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <a
              href="/change-password"
              className="rounded-xl border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-700"
            >
              Change Password
            </a>
          </div>
        </div>
      </PageWrapper>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
