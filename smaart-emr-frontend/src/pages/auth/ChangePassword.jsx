import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { changePassword } from "../../services/auth.service";
import { roleRedirect } from "../../utils/roleRedirect";
import { isStrongPassword, passwordChecks, passwordStrengthScore } from "../../utils/passwordStrength";

const STORAGE_KEY = "pendingPasswordChangeUserId";

export default function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState(location.state?.userId || localStorage.getItem(STORAGE_KEY) || "");
  const [role, setRole] = useState(location.state?.role || "ADMIN");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const checks = useMemo(() => passwordChecks(newPassword), [newPassword]);
  const score = useMemo(() => passwordStrengthScore(newPassword), [newPassword]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!userId) {
      setError("User ID is missing. Please login again.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError("Password must have 8+ chars, uppercase, lowercase, number, and special character.");
      return;
    }

    setLoading(true);
    try {
      await changePassword({ userId, oldPassword, newPassword });
      localStorage.removeItem(STORAGE_KEY);
      setSuccess("Password updated. Redirecting to login...");
      setTimeout(() => {
        const loginPath = role === "PATIENT" ? "/patient/login" : "/staff/login";
        navigate(loginPath, { replace: true });
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-md"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Change Password</h1>
        <p className="mt-1 text-sm text-slate-600">First login requires password update.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">User ID</label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            >
              <option value="ADMIN">Admin/Staff</option>
              <option value="PATIENT">Patient</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
          </div>

          <div className="rounded-xl bg-white/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Password Strength</p>
            <div className="mb-2 h-2 rounded bg-slate-200">
              <div className="h-2 rounded bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" style={{ width: `${(score / 5) * 100}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
              <p className={checks.length ? "text-emerald-700" : ""}>8+ chars</p>
              <p className={checks.upper ? "text-emerald-700" : ""}>Uppercase</p>
              <p className={checks.lower ? "text-emerald-700" : ""}>Lowercase</p>
              <p className={checks.number ? "text-emerald-700" : ""}>Number</p>
              <p className={checks.special ? "text-emerald-700" : ""}>Special char</p>
            </div>
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
