import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import { first, formatDateTime, glassCardClass, inputClass, todayIso } from "./nurse.ui";

const greeting = (hour24) => {
  if (hour24 < 12) return "Good Morning";
  if (hour24 < 17) return "Good Afternoon";
  return "Good Evening";
};

const nowIst = () => {
  const now = new Date();
  const formatted = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const hour24 = Number(
    now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false
    })
  );
  return { formatted, hour24 };
};

export default function NurseProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [clock, setClock] = useState(nowIst());
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || ""
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setClock(nowIst()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || ""
    });
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await nurseDashboardService.getTodayAppointments({ date: todayIso() });
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load nurse profile summary.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const arrived = rows.filter((row) => String(row.status || "").toUpperCase() === "ARRIVED").length;
    const ready = rows.filter((row) => ["READY_FOR_PT", "INTAKE_COMPLETED"].includes(String(row.status || "").toUpperCase())).length;
    return { total, arrived, ready };
  }, [rows]);

  return (
    <DashboardLayout title="Nurse Profile">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className={`${glassCardClass} mb-6`}>
        <p className="text-sm text-slate-600">{greeting(clock.hour24)}</p>
        <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Hi {first(user?.name, "Nurse")} ({first(user?.nurseId || user?.userId, "N/A")})
        </h3>
        <p className="mt-1 text-sm font-medium text-cyan-700">Current IST: {clock.formatted}</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Today's Assigned Sessions</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "..." : stats.total}</p>
        </div>
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Checked-In</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "..." : stats.arrived}</p>
        </div>
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Ready for PT</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? "..." : stats.ready}</p>
        </div>
      </section>

      <section className={`${glassCardClass} mt-8`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Update Contact</h3>
        <div className="grid gap-3 md:grid-cols-3">
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
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={async () => {
              try {
                await nurseDashboardService.updateProfile(form);
                setMessage("Profile updated successfully.");
              } catch (err) {
                setError(err?.message || "Failed to update profile.");
              }
            }}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
          >
            Save Changes
          </button>
          <a
            href="/change-password"
            className="rounded-xl border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-700"
          >
            Change Password
          </a>
        </div>
      </section>

      <section className={`${glassCardClass} mt-8`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Today Activity Log</h3>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row._id || row.appointmentId} className="rounded-xl bg-white/35 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                {first(row?.patient?.patientId)} - {first(row?.patient?.firstName, "")} {first(row?.patient?.lastName, "")}
              </p>
              <p>
                {first(row.timeSlot)} | PT: {first(row?.physiotherapist?.name)}
              </p>
              <p>Status: {first(row.status)}</p>
              <p>Check-In: {formatDateTime(row.checkInAt)}</p>
            </div>
          ))}
          {!loading && !rows.length ? <p className="text-sm text-slate-600">No activity logged for today.</p> : null}
        </div>
      </section>
    </DashboardLayout>
  );
}
