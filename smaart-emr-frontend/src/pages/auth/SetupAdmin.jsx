import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { checkAdminExists, registerAdmin } from "../../services/auth.service";
import { isStrongPassword, passwordChecks, passwordStrengthScore } from "../../utils/passwordStrength";

const initialState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: ""
};

export default function SetupAdmin() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const checks = passwordChecks(form.password);
  const score = passwordStrengthScore(form.password);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await checkAdminExists();
        if (res?.data?.data?.exists) {
          navigate("/staff/login", { replace: true });
          return;
        }
      } catch {
        navigate("/staff/login", { replace: true });
        return;
      } finally {
        setChecking(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError("Password must have 8+ chars, uppercase, lowercase, number, and special character.");
      return;
    }

    setLoading(true);
    try {
      await registerAdmin({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      });
      setSuccess("Admin setup completed. Redirecting to staff login...");
      setTimeout(() => navigate("/staff/login", { replace: true }), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to setup admin account.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-xl rounded-2xl border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-md"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Initial Admin Setup</h1>
        <p className="mt-2 text-sm text-slate-600">Create the first admin account for SMAART EMR.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {[
            ["name", "Name", "text"],
            ["email", "Email", "email"],
            ["phone", "Phone", "text"],
            ["password", "Password", "password"],
            ["confirmPassword", "Confirm Password", "password"]
          ].map(([name, label, type]) => (
            <div key={name}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</label>
              <input
                name={name}
                type={type}
                value={form[name]}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-300"
              />
            </div>
          ))}

          <div className="rounded-xl bg-white/30 p-3">
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
          {success ? (
            <p className="inline-flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 size={16} /> {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60"
          >
            {loading ? "Creating Admin..." : "Create Admin Account"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
