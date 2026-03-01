import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserRound, Stethoscope } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { changePassword } from "../../services/auth.service";
import { roleRedirect } from "../../utils/roleRedirect";
import { AUTH_STORAGE_KEYS } from "../../services/api";
import { isStrongPassword } from "../../utils/passwordStrength";

const LOGIN_KEYS = {
  STAFF: {
    saved: "loginSavedStaff",
    lastUsed: "loginLastUsedStaff"
  },
  PATIENT: {
    saved: "loginSavedPatient",
    lastUsed: "loginLastUsedPatient"
  }
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const initialMode = location.pathname.includes("/patient") ? "PATIENT" : "STAFF";
  const [mode, setMode] = useState(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  const [lastUsed, setLastUsed] = useState("");

  const [showChangePopup, setShowChangePopup] = useState(false);
  const [changeUserId, setChangeUserId] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);

  const tokenExpired = localStorage.getItem(AUTH_STORAGE_KEYS.tokenExpired) === "1";
  const endpointLabel = useMemo(
    () => (mode === "PATIENT" ? "Patient Portal Login" : "Staff Access Login"),
    [mode]
  );

  useEffect(() => {
    const keys = LOGIN_KEYS[mode];
    const saved = localStorage.getItem(keys.saved);
    const savedLastUsed = localStorage.getItem(keys.lastUsed);

    setIdentifier("");
    setPassword("");
    setRememberLogin(true);
    setLastUsed("");

    if (savedLastUsed) {
      const parsed = Number(savedLastUsed);
      if (!Number.isNaN(parsed)) {
        setLastUsed(new Date(parsed).toLocaleString());
      }
    }

    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setIdentifier(parsed.identifier || "");
      setPassword(parsed.password || "");
      setRememberLogin(Boolean(parsed.remember));
    } catch {
      localStorage.removeItem(keys.saved);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "PATIENT") {
      setShowChangePopup(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [mode]);

  const persistLoginData = (identifierValue, passwordValue) => {
    const keys = LOGIN_KEYS[mode];
    const now = Date.now();
    localStorage.setItem(keys.lastUsed, String(now));
    setLastUsed(new Date(now).toLocaleString());

    if (rememberLogin) {
      localStorage.setItem(
        keys.saved,
        JSON.stringify({
          identifier: identifierValue,
          password: passwordValue,
          remember: true
        })
      );
    } else {
      localStorage.removeItem(keys.saved);
    }
  };

  const openChangePasswordPopup = (userId, currentPassword) => {
    setChangeUserId(userId || "");
    setOldPassword(currentPassword || "");
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePopup(true);
    setBanner("First login detected. Update password to continue.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setBanner("");
    setLoading(true);

    try {
      const payload =
        mode === "PATIENT"
          ? { identifier, password }
          : identifier.includes("@")
            ? { identifier, password }
            : { userId: identifier, password };

      const response = await login(payload);
      if (!response?.success) {
        throw new Error("Invalid login credentials.");
      }

      persistLoginData(identifier, password);

      if (response?.mustChangePassword) {
        openChangePasswordPopup(response?.user?.id || "", password);
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

  const submitPasswordChange = async (event) => {
    event.preventDefault();
    setError("");
    setBanner("");

    if (!changeUserId) {
      setError("User not identified. Please login again.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
      return;
    }

    setChanging(true);
    try {
      await changePassword({
        userId: changeUserId,
        oldPassword,
        newPassword
      });
      setShowChangePopup(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setBanner("Password updated successfully. Please login with your new password.");
      setPassword("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to change password.");
    } finally {
      setChanging(false);
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
        {lastUsed ? (
          <p className="mt-2 text-xs font-medium text-slate-600">
            Last used ({mode === "STAFF" ? "Staff" : "Patient"}): {lastUsed}
          </p>
        ) : null}
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
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={rememberLogin}
              onChange={(e) => setRememberLogin(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-400"
            />
            Save login and password on this device
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {banner ? <p className="text-sm text-emerald-700">{banner}</p> : null}

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

      {showChangePopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submitPasswordChange}
            className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl"
          >
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">First Login Password Update</h2>
            <p className="mt-1 text-sm text-slate-600">Update your password to continue securely.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Old Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowChangePopup(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={changing}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {changing ? "Updating..." : "Update Password"}
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}
    </div>
  );
}
