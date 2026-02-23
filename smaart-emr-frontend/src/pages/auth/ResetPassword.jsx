import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { resetPassword } from "../../services/auth.service";
import { isStrongPassword, passwordChecks, passwordStrengthScore } from "../../utils/passwordStrength";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const checks = passwordChecks(newPassword);
  const score = passwordStrengthScore(newPassword);
  const canSubmit = useMemo(
    () => token && newPassword && confirmPassword && newPassword === confirmPassword && isStrongPassword(newPassword),
    [token, newPassword, confirmPassword]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!canSubmit) {
      setError("Please provide a strong matching password.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess("Password reset successful. You can login now.");
    } catch (err) {
      setError(err?.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-md">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reset Password</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none"
            required
          />

          <div className="rounded-xl bg-white/30 p-3">
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
          <button disabled={loading || !canSubmit} className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <p className="text-sm text-slate-600">Back to <Link to="/staff/login" className="font-semibold text-cyan-700">Login</Link></p>
        </form>
      </motion.div>
    </div>
  );
}
