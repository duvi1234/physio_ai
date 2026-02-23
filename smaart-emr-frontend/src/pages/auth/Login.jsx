import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserRound, Stethoscope } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { roleRedirect } from "../../utils/roleRedirect";
import { AUTH_STORAGE_KEYS } from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [mode, setMode] = useState(location.pathname.includes("/patient") ? "PATIENT" : "STAFF");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tokenExpired = localStorage.getItem(AUTH_STORAGE_KEYS.tokenExpired) === "1";
  const endpointLabel = useMemo(() => (mode === "PATIENT" ? "Patient Portal Login" : "Staff Access Login"), [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = mode === "PATIENT"
        ? { identifier, password }
        : identifier.includes("@")
          ? { identifier, password }
          : { userId: identifier, password };

      const response = await login(payload);
      if (!response?.success) {
        throw new Error("Invalid login credentials.");
      }
      if (response?.mustChangePassword) {
        const pendingUserId = response?.user?.id || "";
        if (pendingUserId) {
          localStorage.setItem("pendingPasswordChangeUserId", pendingUserId);
        }
        navigate("/change-password", {
          replace: true,
          state: { userId: pendingUserId, role: mode }
        });
        return;
      }
      if (!response?.user?.role) {
        throw new Error("Unable to determine user role for login.");
      }

      localStorage.removeItem(AUTH_STORAGE_KEYS.tokenExpired);
      navigate(roleRedirect(response.user.role), { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Invalid login credentials";
      if (/expired/i.test(message)) {
        setError("Session token expired. Please sign in again.");
      } else if (/unauthorized|forbidden/i.test(message)) {
        setError("Unauthorized role access for this portal.");
      } else {
        setError(message);
      }
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
        <div className="mb-6 flex gap-2 rounded-xl bg-white/30 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("STAFF");
              navigate("/staff/login", { replace: true });
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === "STAFF" ? "bg-white text-slate-900" : "text-slate-600"}`}
          >
            <span className="inline-flex items-center gap-2"><Stethoscope size={14} /> Login as Staff</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("PATIENT");
              navigate("/patient/login", { replace: true });
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === "PATIENT" ? "bg-white text-slate-900" : "text-slate-600"}`}
          >
            <span className="inline-flex items-center gap-2"><UserRound size={14} /> Login as Patient</span>
          </button>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{endpointLabel}</h1>
        <p className="mt-1 text-sm text-slate-600">Secure authentication for hospital workflows.</p>

        {tokenExpired ? <p className="mt-4 text-sm text-amber-700">Session expired. Please login again.</p> : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              {mode === "PATIENT" ? "Email / Phone" : "User ID or Email"}
            </label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-300"
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Login"}
          </button>
        </form>

        {mode === "PATIENT" ? (
          <p className="mt-4 text-sm text-slate-600">
            New patient? <Link to="/patient/register" className="font-semibold text-cyan-700">Create account</Link>
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">
          Forgot password? <Link to="/forgot-password" className="font-semibold text-cyan-700">Reset here</Link>
        </p>
      </motion.div>
    </div>
  );
}
