import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../../layouts/DashboardLayout";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import StatusBadge from "../../components/ui/StatusBadge";
import { first, formatDate, formatDateTime, glassCardClass, inputClass, sectionMutedClass, toArray, todayIso } from "./nurse.ui";

export default function PatientCheckIn() {
  const [searchParams] = useSearchParams();
  const presetPatientId = searchParams.get("patientId") || "";
  const presetAppointmentId = searchParams.get("appointmentId") || "";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState(presetPatientId);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(presetAppointmentId);
  const [checkInForm, setCheckInForm] = useState({
    phone: "",
    email: "",
    appointmentType: "WALK_IN"
  });

  const loadTodayAppointments = async () => {
    try {
      const data = await nurseDashboardService.getTodayAppointments({ date: todayIso() });
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    }
  };

  useEffect(() => {
    loadTodayAppointments();
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    setCheckInForm((prev) => ({
      ...prev,
      phone: selectedPatient.phone || "",
      email: selectedPatient.email || ""
    }));
  }, [selectedPatient]);

  const runSearch = async (event) => {
    if (event) event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const rows = await nurseDashboardService.searchPatients(query);
      setPatients(Array.isArray(rows) ? rows : []);
      if (rows?.length === 1) {
        setSelectedPatient(rows[0]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to search patients.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (presetPatientId) runSearch();
  }, [presetPatientId]);

  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    const pid = String(selectedPatient.patientId || selectedPatient._id);
    return appointments.filter((row) => {
      const rowPid = String(row?.patient?.patientId || row?.patient?._id || "");
      return rowPid === pid;
    });
  }, [appointments, selectedPatient]);

  const selectedAppointment = useMemo(
    () =>
      patientAppointments.find((row) => String(row._id || row.appointmentId) === String(selectedAppointmentId)) ||
      patientAppointments[0] ||
      null,
    [patientAppointments, selectedAppointmentId]
  );

  const markArrived = async () => {
    if (!selectedAppointment) {
      setError("Select an appointment to continue.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await nurseDashboardService.checkInAppointment({
        appointmentId: selectedAppointment._id || selectedAppointment.appointmentId,
        status: "ARRIVED",
        phone: checkInForm.phone,
        email: checkInForm.email,
        appointmentType: checkInForm.appointmentType
      });
      setMessage("Patient marked as arrived and contact details updated.");
      await loadTodayAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || "Check-in failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Patient Check-In">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className={`${glassCardClass} mb-6`}>
        <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Search Patient</h3>
        <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={runSearch}>
          <input
            className={inputClass}
            placeholder="Patient ID / Mobile / Name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
          >
            Search
          </button>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={glassCardClass}>
          <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Patient Results</h3>
          {loading ? <p className={sectionMutedClass}>Searching...</p> : null}
          <div className="space-y-3">
            {patients.map((row) => (
              <motion.button
                key={row._id || row.patientId}
                type="button"
                onClick={() => setSelectedPatient(row)}
                className={`w-full rounded-xl border p-4 text-left transition-all duration-300 hover:scale-[1.01] ${
                  String(selectedPatient?._id || selectedPatient?.patientId) === String(row._id || row.patientId)
                    ? "border-cyan-300 bg-cyan-50/70"
                    : "border-white/30 bg-white/35"
                }`}
              >
                <p className="font-semibold text-slate-900">
                  {`${first(row.firstName, "")} ${first(row.lastName, "")}`.trim() || first(row.name)}
                </p>
                <p className="text-sm text-slate-700">Patient ID: {first(row.patientId)}</p>
                <p className="text-sm text-slate-700">Phone: {first(row.phone)}</p>
              </motion.button>
            ))}
            {!loading && !patients.length ? <p className={sectionMutedClass}>No patient result yet.</p> : null}
          </div>
        </div>

        <div className={glassCardClass}>
          <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Check-In Details</h3>
          {selectedPatient ? (
            <div className="space-y-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {`${first(selectedPatient.firstName, "")} ${first(selectedPatient.lastName, "")}`.trim() || first(selectedPatient.name)}
              </p>
              <p>
                <span className="font-semibold">Patient ID:</span> {first(selectedPatient.patientId)}
              </p>
              <p>
                <span className="font-semibold">Gender:</span> {first(selectedPatient.gender)}
              </p>
              <p>
                <span className="font-semibold">DOB:</span> {selectedPatient.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : "-"}
              </p>

              <select
                className={inputClass}
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
              >
                <option value="">Select Appointment</option>
                {patientAppointments.map((row) => (
                  <option key={row._id || row.appointmentId} value={row._id || row.appointmentId}>
                    {first(row.timeSlot)} | {formatDate(row.appointmentDate)} | {first(row?.physiotherapist?.name)}
                  </option>
                ))}
              </select>

              {selectedAppointment ? (
                <div className="rounded-xl bg-white/35 p-3">
                  <p className="font-semibold text-slate-900">Appointment Details</p>
                  <p>Date: {formatDate(selectedAppointment.appointmentDate)}</p>
                  <p>Time: {first(selectedAppointment.timeSlot)}</p>
                  <p>PT: {first(selectedAppointment?.physiotherapist?.name)}</p>
                  <p>
                    Status: <StatusBadge status={first(selectedAppointment.status)} />
                  </p>
                  <p>Check-In At: {formatDateTime(selectedAppointment.checkInAt)}</p>
                </div>
              ) : null}

              <input
                className={inputClass}
                placeholder="Mobile number"
                value={checkInForm.phone}
                onChange={(e) => setCheckInForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Email"
                value={checkInForm.email}
                onChange={(e) => setCheckInForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <select
                className={inputClass}
                value={checkInForm.appointmentType}
                onChange={(e) => setCheckInForm((prev) => ({ ...prev, appointmentType: e.target.value }))}
              >
                <option value="WALK_IN">Walk-In</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
              <button
                type="button"
                onClick={markArrived}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60"
              >
                {saving ? "Updating..." : "Mark as Arrived"}
              </button>
            </div>
          ) : (
            <p className={sectionMutedClass}>Select a patient to proceed with check-in.</p>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
