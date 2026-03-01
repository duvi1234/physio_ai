import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { forgotPassword } from "../../services/auth.service";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deliveryHint, setDeliveryHint] = useState("");
  const [devResetLink, setDevResetLink] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDeliveryHint("");
    setDevResetLink("");
    setLoading(true);
    try {
      const res = await forgotPassword(identifier);
      const data = res?.data?.data || {};
      setSuccess("If the account exists, reset instructions have been sent.");
      if (data?.delivery?.emailSent === false) {
        setDeliveryHint(data?.delivery?.emailError || "Email delivery failed. Configure SMTP credentials.");
      }
      if (data?.resetLink) {
        setDevResetLink(data.resetLink);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-md">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Forgot Password</h1>
        <p className="mt-1 text-sm text-slate-600">Enter your email or phone to receive reset instructions.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email or Phone"
            className="w-full rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-sm outline-none"
            required
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          {deliveryHint ? <p className="text-sm text-amber-700">{deliveryHint}</p> : null}
          {devResetLink ? (
            <p className="break-all rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Dev Reset Link: {devResetLink}
            </p>
          ) : null}
          <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
          <p className="text-sm text-slate-600">Back to <Link to="/staff/login" className="font-semibold text-cyan-700">Login</Link></p>
        </form>
      </motion.div>
    </div>
  );
}
