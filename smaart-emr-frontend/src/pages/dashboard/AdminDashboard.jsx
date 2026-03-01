import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, CalendarDays, ClipboardList, Stethoscope } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { adminApiExamples } from "../../services/api.examples";

const glass = "bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20";
const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200";
const toArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};
const first = (value, fallback = "-") => (value === undefined || value === null || value === "" ? fallback : value);
const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const toAssetUrl = (filePath = "") => {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const normalized = String(filePath).replace(/\\/g, "/");
  const uploadsIndex = normalized.toLowerCase().indexOf("uploads/");
  const relative = uploadsIndex >= 0 ? normalized.slice(uploadsIndex) : normalized.replace(/^\/+/, "");
  return `${apiBase}/${relative.replace(/^\/+/, "")}`;
};
const formatIstDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};
const todayDate = new Date().toISOString().split("T")[0];
const timeSlots = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM"
];
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const countryOptions = ["India", "United States", "United Kingdom", "UAE", "Singapore", "Australia", "Canada", "Other"];
const getMinutes = (value = "") => {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hour = Number(match[1]);
    const min = Number(match[2]);
    const ap = match[3].toUpperCase();
    if (ap === "AM" && hour === 12) hour = 0;
    if (ap === "PM" && hour !== 12) hour += 12;
    return hour * 60 + min;
  }
  const plain = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!plain) return null;
  return Number(plain[1]) * 60 + Number(plain[2]);
};
const slotStartMins = (slot = "") => getMinutes(String(slot).split("-")[0]?.trim());
const calcAge = (dob) => {
  if (!dob) return "";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return Math.max(age, 0);
};

const emptyPatientForm = {
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  age: "",
  phone: "",
  email: "",
  bloodGroup: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  allergies: "",
  insuranceProvider: "",
  insuranceNumber: ""
};
const emptyNurseForm = { name: "", phone: "", email: "" };
const emptyPhysioForm = { name: "", phone: "", email: "", specialization: "Physiotherapy" };
const emptyAppointmentForm = {
  patientId: "",
  physiotherapistId: "",
  assignedTo: "",
  appointmentDate: todayDate,
  timeSlot: timeSlots[0],
  location: "Main Clinic",
  appointmentType: "WALK_IN",
  notes: ""
};
const describeLoadFailure = (reason) => {
  const status = reason?.response?.status;
  const message = reason?.response?.data?.message || reason?.message || "request failed";
  if (status === 429) return "rate limited (429)";
  if (status === 401) return "unauthorized (401)";
  if (status === 403) return "forbidden (403)";
  if (status) return `${message} (${status})`;
  return message;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [nurseForm, setNurseForm] = useState(emptyNurseForm);
  const [physioForm, setPhysioForm] = useState(emptyPhysioForm);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointmentForm);
  const [requestDrafts, setRequestDrafts] = useState({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [patientSearchId, setPatientSearchId] = useState("");
  const [patientSearchResult, setPatientSearchResult] = useState(null);
  const [patientView, setPatientView] = useState({ open: false, patient: null, vitals: [], records: [], appointments: [], loading: false });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("appointmentDate");
  const [sortOrder, setSortOrder] = useState("asc");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder,
      }).toString();

      const [pRes, aRes, rRes, cRes, nRes, attRes] = await Promise.allSettled([
        adminApiExamples.getPatients(),
        adminApiExamples.getAppointments(query),
        adminApiExamples.getAppointmentRequests(),
        adminApiExamples.getConsultants(),
        adminApiExamples.getNurses(),
        adminApiExamples.getStaffAttendanceToday(),
      ]);

      // Process results with proper data handling
      if (pRes.status === "fulfilled") {
        const data = toArray(pRes.value);
        setPatients(data || []);
      } else {
        console.warn("Failed to load patients:", pRes.reason?.message || pRes.reason);
        setPatients([]);
      }

      if (aRes.status === "fulfilled") {
        const data = toArray(aRes.value);
        setAppointments(data || []);
      } else {
        console.warn("Failed to load appointments:", aRes.reason?.message || aRes.reason);
        setAppointments([]);
      }

      if (rRes.status === "fulfilled") {
        const data = toArray(rRes.value);
        setRequests(data || []);
      } else {
        console.warn("Failed to load requests:", rRes.reason?.message || rRes.reason);
        setRequests([]);
      }

      if (cRes.status === "fulfilled") {
        const data = toArray(cRes.value);
        setConsultants(data || []);
      } else {
        console.warn("Failed to load consultants:", cRes.reason?.message || cRes.reason);
        setConsultants([]);
      }

      if (nRes.status === "fulfilled") {
        const data = toArray(nRes.value);
        setNurses(data || []);
      } else {
        console.warn("Failed to load nurses:", nRes.reason?.message || nRes.reason);
        setNurses([]);
      }

      if (attRes.status === "fulfilled") {
        const data = toArray(attRes.value);
        setAttendance(data || []);
      } else {
        console.warn("Failed to load attendance:", attRes.reason?.message || attRes.reason);
        setAttendance([]);
      }

      const failed = [
        pRes.status === "rejected" ? `patients (${describeLoadFailure(pRes.reason)})` : null,
        aRes.status === "rejected" ? `appointments (${describeLoadFailure(aRes.reason)})` : null,
        rRes.status === "rejected" ? `requests (${describeLoadFailure(rRes.reason)})` : null,
        cRes.status === "rejected" ? `consultants (${describeLoadFailure(cRes.reason)})` : null,
        nRes.status === "rejected" ? `nurses (${describeLoadFailure(nRes.reason)})` : null,
        attRes.status === "rejected" ? `attendance (${describeLoadFailure(attRes.reason)})` : null
      ].filter(Boolean);

      if (failed.length) {
        setError(`Some dashboard blocks failed to load: ${failed.join(", ")}.`);
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(err?.response?.data?.message || "Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setPatientForm((prev) => ({ ...prev, age: calcAge(prev.dateOfBirth) }));
  }, [patientForm.dateOfBirth]);

  const pendingRequests = useMemo(
    () => requests.filter((r) => String(r.status || "").toUpperCase() === "PENDING"),
    [requests]
  );
  const createdItems = useMemo(
    () => ({
      patientIds: patients
        .map((p) => ({ id: p.patientId, name: `${first(p.firstName, "")} ${first(p.lastName, "")}`.trim() || "-" }))
        .filter((x) => x.id),
      nurseIds: nurses
        .map((n) => ({ id: n.nurseId || n.userId, name: n.name || "-" }))
        .filter((x) => x.id),
      physioIds: consultants
        .map((c) => ({ id: c.physioId || c.userId, name: c.name || "-" }))
        .filter((x) => x.id)
    }),
    [patients, nurses, consultants]
  );

  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter((a) => new Date(a.appointmentDate).toDateString() === today).length;
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (statusFilter === "ALL") return appointments;
    if (statusFilter === "SCHEDULED") return appointments.filter((a) => String(a.status || "").toUpperCase() === "CONFIRMED");
    return appointments.filter((a) => String(a.status || "").toUpperCase() === statusFilter);
  }, [appointments, statusFilter]);

  const hasConflict = (id, roleType) => {
    if (!id || !appointmentForm.appointmentDate || !appointmentForm.timeSlot) return false;
    return appointments.some((a) => {
      const status = String(a.status || "").toUpperCase();
      if (!["PENDING", "CONFIRMED"].includes(status)) return false;
      if (new Date(a.appointmentDate).toDateString() !== new Date(appointmentForm.appointmentDate).toDateString()) return false;
      if (String(a.timeSlot || "") !== String(appointmentForm.timeSlot || "")) return false;
      if (roleType === "PHYSIO") {
        return String(a.physiotherapist?.physioId || a.physiotherapist?.userId || a.physiotherapist?._id) === String(id);
      }
      return String(a.assignedTo?.nurseId || a.assignedTo?.userId || a.assignedTo?._id) === String(id);
    });
  };

  const availablePhysios = useMemo(() => {
    return consultants.filter((c) => {
      const id = c.physioId || c.userId || c._id;
      if (hasConflict(id, "PHYSIO")) return false;
      if (!appointmentForm.appointmentDate || !appointmentForm.timeSlot) return true;
      const avail = Array.isArray(c.availability) ? c.availability : [];
      if (!avail.length) return true;
      const day = new Date(appointmentForm.appointmentDate).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const start = slotStartMins(appointmentForm.timeSlot);
      if (start === null) return true;
      const daySlots = avail.filter((a) => String(a.day || "").toLowerCase() === day);
      if (!daySlots.length) return false;
      return daySlots.some((s) => {
        const sStart = getMinutes(s.startTime);
        const sEnd = getMinutes(s.endTime);
        if (sStart === null || sEnd === null) return true;
        return start >= sStart && start < sEnd;
      });
    });
  }, [consultants, appointments, appointmentForm.appointmentDate, appointmentForm.timeSlot]);

  const availableNurses = useMemo(
    () => nurses.filter((n) => !hasConflict(n.nurseId || n.userId || n._id, "NURSE")),
    [nurses, appointments, appointmentForm.appointmentDate, appointmentForm.timeSlot]
  );
  const noPhysioAvailable =
    Boolean(appointmentForm.appointmentDate && appointmentForm.timeSlot) && availablePhysios.length === 0;
  const noNurseAvailable =
    Boolean(appointmentForm.appointmentDate && appointmentForm.timeSlot) && availableNurses.length === 0;

  const withSubmit = async (fn) => {
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await fn();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const createPatient = async (e) => {
    e.preventDefault();
    if (!patientForm.firstName || !patientForm.lastName || !patientForm.phone || !patientForm.gender || !patientForm.dateOfBirth) {
      setError("First name, last name, phone, gender and DOB are required.");
      return;
    }
    if (!patientForm.emergencyContactName || !patientForm.emergencyContactRelationship || !patientForm.emergencyContactPhone) {
      setError("Emergency contact name, relationship and phone are required.");
      return;
    }
    await withSubmit(async () => {
      const payload = {
        firstName: patientForm.firstName,
        lastName: patientForm.lastName,
        gender: patientForm.gender,
        dateOfBirth: patientForm.dateOfBirth,
        age: patientForm.age || calcAge(patientForm.dateOfBirth),
        phone: patientForm.phone,
        email: patientForm.email || undefined,
        bloodGroup: patientForm.bloodGroup || undefined,
        addressLine1: patientForm.addressLine1 || "",
        addressLine2: patientForm.addressLine2 || "",
        city: patientForm.city || "",
        state: patientForm.state || "",
        postalCode: patientForm.postalCode || "",
        country: patientForm.country || undefined,
        emergencyContactName: patientForm.emergencyContactName,
        emergencyContactRelationship: patientForm.emergencyContactRelationship,
        emergencyContactPhone: patientForm.emergencyContactPhone,
        insuranceProvider: patientForm.insuranceProvider || undefined,
        insuranceNumber: patientForm.insuranceNumber || undefined,
        allergies: String(patientForm.allergies || "").split(",").map((x) => x.trim()).filter(Boolean)
      };
      const res = await adminApiExamples.createPatient(payload);
      const newId = res?.data?.data?.patient?.patientId || res?.data?.data?.patientId;
      setMessage(`Patient created successfully. ID: ${first(newId)}`);
      setPatientForm(emptyPatientForm);
    });
  };

  const createNurse = async (e) => {
    e.preventDefault();
    await withSubmit(async () => {
      const res = await adminApiExamples.createNurse(nurseForm);
      setMessage(`Nurse created. ID: ${first(res?.data?.data?.nurseId || res?.data?.data?.userId)}`);
      setNurseForm(emptyNurseForm);
    });
  };

  const createPhysio = async (e) => {
    e.preventDefault();
    await withSubmit(async () => {
      const res = await adminApiExamples.createPhysio(physioForm);
      setMessage(`Physio created. ID: ${first(res?.data?.data?.physioId || res?.data?.data?.userId)}`);
      setPhysioForm(emptyPhysioForm);
    });
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    await withSubmit(async () => {
      await adminApiExamples.createAppointment(appointmentForm);
      setMessage("Appointment booked successfully.");
      setAppointmentForm(emptyAppointmentForm);
    });
  };

  const convertRequest = async (req) => {
    const draft = requestDrafts[req.requestId] || {};
    await withSubmit(async () => {
      const res = await adminApiExamples.convertAppointmentRequest(req.requestId, {
        physiotherapistId: draft.physiotherapistId || appointmentForm.physiotherapistId,
        assignedTo: draft.assignedTo || appointmentForm.assignedTo || undefined,
        appointmentDate: draft.appointmentDate || (req.preferredDate ? new Date(req.preferredDate).toISOString().split("T")[0] : todayDate),
        timeSlot: draft.timeSlot || req.preferredTimeSlot || appointmentForm.timeSlot,
        location: draft.location || req.location || appointmentForm.location,
        appointmentType: "WALK_IN",
        gender: draft.gender || "Other"
      });
      setMessage(`Request converted. Patient ${first(res?.data?.data?.patient?.patientId)} created.`);
    });
  };

  const openPatient = async (patientId) => {
    const patient = patients.find((p) => p.patientId === patientId);
    if (!patient) return;
    setPatientView({ open: true, patient, vitals: [], records: [], appointments: [], loading: true });
    try {
      const [vRes, mRes] = await Promise.all([
        adminApiExamples.getPatientVitals(patientId),
        adminApiExamples.getPatientRecords(patientId)
      ]);
      const patientAppointments = appointments.filter((a) => String(a.patient?.patientId) === String(patientId));
      setPatientView({ open: true, patient, vitals: toArray(vRes), records: toArray(mRes), appointments: patientAppointments, loading: false });
    } catch {
      setPatientView((prev) => ({ ...prev, loading: false }));
    }
  };

  const searchPatientById = (e) => {
    e.preventDefault();
    const id = String(patientSearchId || "").trim().toUpperCase();
    if (!id) {
      setPatientSearchResult(null);
      return;
    }
    const result = patients.find((p) => String(p.patientId || "").toUpperCase() === id) || null;
    setPatientSearchResult(result);
    if (!result) {
      setError("Patient not found for the entered Patient ID.");
    } else {
      setError("");
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[{ title: "Patients", value: patients.length, icon: Users }, { title: "Today Appointments", value: todayAppointments, icon: CalendarDays }, { title: "Pending Requests", value: pendingRequests.length, icon: ClipboardList }, { title: "Physiotherapists", value: consultants.length, icon: Stethoscope }].map((card) => (
          <motion.div key={card.title} className={`${glass} p-6`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <card.icon className="mb-3 text-cyan-700" size={20} />
            <p className="text-sm text-slate-600">{card.title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{loading ? "..." : card.value}</p>
          </motion.div>
        ))}
      </section>

      <motion.section className={`mt-6 ${glass} p-6`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        <h3 className="mb-3 text-lg font-semibold">Created IDs Overview</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white/70 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Patient IDs</p>
            <div className="max-h-32 overflow-auto text-xs text-slate-700">
              {createdItems.patientIds.length ? createdItems.patientIds.map((row) => <p key={row.id}>{row.id} - {row.name}</p>) : <p>-</p>}
            </div>
          </div>
          <div className="rounded-xl bg-white/70 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Nurse IDs</p>
            <div className="max-h-32 overflow-auto text-xs text-slate-700">
              {createdItems.nurseIds.length ? createdItems.nurseIds.map((row) => <p key={row.id}>{row.id} - {row.name}</p>) : <p>-</p>}
            </div>
          </div>
          <div className="rounded-xl bg-white/70 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Physio IDs</p>
            <div className="max-h-32 overflow-auto text-xs text-slate-700">
              {createdItems.physioIds.length ? createdItems.physioIds.map((row) => <p key={row.id}>{row.id} - {row.name}</p>) : <p>-</p>}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section className="mt-6 grid gap-6 xl:grid-cols-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <form className={`${glass} p-6 space-y-3`} onSubmit={createNurse}>
          <h3 className="text-lg font-semibold">Create Nurse</h3>
          <input className={inputClass} placeholder="Full Name" value={nurseForm.name} onChange={(e) => setNurseForm((v) => ({ ...v, name: e.target.value }))} />
          <input className={inputClass} placeholder="Phone" value={nurseForm.phone} onChange={(e) => setNurseForm((v) => ({ ...v, phone: e.target.value }))} />
          <input className={inputClass} placeholder="Email" value={nurseForm.email} onChange={(e) => setNurseForm((v) => ({ ...v, email: e.target.value }))} />
          <button className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">{submitting ? "Saving..." : "Create Nurse"}</button>
        </form>

        <form className={`${glass} p-6 space-y-3`} onSubmit={createPhysio}>
          <h3 className="text-lg font-semibold">Create Physio</h3>
          <input className={inputClass} placeholder="Full Name" value={physioForm.name} onChange={(e) => setPhysioForm((v) => ({ ...v, name: e.target.value }))} />
          <input className={inputClass} placeholder="Phone" value={physioForm.phone} onChange={(e) => setPhysioForm((v) => ({ ...v, phone: e.target.value }))} />
          <input className={inputClass} placeholder="Email" value={physioForm.email} onChange={(e) => setPhysioForm((v) => ({ ...v, email: e.target.value }))} />
          <button className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">{submitting ? "Saving..." : "Create Physio"}</button>
        </form>
      </motion.section>

      <motion.section className="mt-6 grid gap-6 xl:grid-cols-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <form className={`${glass} p-6 space-y-3`} onSubmit={createPatient}>
          <h3 className="text-lg font-semibold">Create Patient</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="First Name *" value={patientForm.firstName} onChange={(e) => setPatientForm((v) => ({ ...v, firstName: e.target.value }))} />
            <input className={inputClass} placeholder="Last Name *" value={patientForm.lastName} onChange={(e) => setPatientForm((v) => ({ ...v, lastName: e.target.value }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select className={inputClass} value={patientForm.gender} onChange={(e) => setPatientForm((v) => ({ ...v, gender: e.target.value }))}>
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input type="date" max={todayDate} className={inputClass} value={patientForm.dateOfBirth} onChange={(e) => setPatientForm((v) => ({ ...v, dateOfBirth: e.target.value }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="Age (auto)" value={patientForm.age} readOnly />
            <select className={inputClass} value={patientForm.bloodGroup} onChange={(e) => setPatientForm((v) => ({ ...v, bloodGroup: e.target.value }))}>
              <option value="">Select Blood Group</option>
              {bloodGroupOptions.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="Phone *" value={patientForm.phone} onChange={(e) => setPatientForm((v) => ({ ...v, phone: e.target.value }))} />
            <input className={inputClass} placeholder="Email" value={patientForm.email} onChange={(e) => setPatientForm((v) => ({ ...v, email: e.target.value }))} />
          </div>
          <input className={inputClass} placeholder="Address Line 1" value={patientForm.addressLine1} onChange={(e) => setPatientForm((v) => ({ ...v, addressLine1: e.target.value }))} />
          <input className={inputClass} placeholder="Address Line 2" value={patientForm.addressLine2} onChange={(e) => setPatientForm((v) => ({ ...v, addressLine2: e.target.value }))} />
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="City" value={patientForm.city} onChange={(e) => setPatientForm((v) => ({ ...v, city: e.target.value }))} />
            <input className={inputClass} placeholder="State" value={patientForm.state} onChange={(e) => setPatientForm((v) => ({ ...v, state: e.target.value }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="Postal Code" value={patientForm.postalCode} onChange={(e) => setPatientForm((v) => ({ ...v, postalCode: e.target.value }))} />
            <select className={inputClass} value={patientForm.country} onChange={(e) => setPatientForm((v) => ({ ...v, country: e.target.value }))}>
              <option value="">Select Country</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="Emergency Contact Name *" value={patientForm.emergencyContactName} onChange={(e) => setPatientForm((v) => ({ ...v, emergencyContactName: e.target.value }))} />
            <input className={inputClass} placeholder="Relationship *" value={patientForm.emergencyContactRelationship} onChange={(e) => setPatientForm((v) => ({ ...v, emergencyContactRelationship: e.target.value }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="Emergency Contact Phone *" value={patientForm.emergencyContactPhone} onChange={(e) => setPatientForm((v) => ({ ...v, emergencyContactPhone: e.target.value }))} />
            <input className={inputClass} placeholder="Allergies (comma separated)" value={patientForm.allergies} onChange={(e) => setPatientForm((v) => ({ ...v, allergies: e.target.value }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} placeholder="Insurance Provider" value={patientForm.insuranceProvider} onChange={(e) => setPatientForm((v) => ({ ...v, insuranceProvider: e.target.value }))} />
            <input className={inputClass} placeholder="Insurance Number" value={patientForm.insuranceNumber} onChange={(e) => setPatientForm((v) => ({ ...v, insuranceNumber: e.target.value }))} />
          </div>
          <button className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">{submitting ? "Saving..." : "Create Patient"}</button>
        </form>

        <form className={`${glass} p-6 space-y-3`} onSubmit={createAppointment}>
          <h3 className="text-lg font-semibold">Create Appointment</h3>
          <select className={inputClass} value={appointmentForm.patientId} onChange={(e) => setAppointmentForm((v) => ({ ...v, patientId: e.target.value }))}>
            <option value="">Select Patient ID</option>
            {patients.map((p) => <option key={p.patientId} value={p.patientId}>{`${p.patientId} - ${first(p.firstName, "")} ${first(p.lastName, "")}`.trim()}</option>)}
          </select>
          <select className={inputClass} value={appointmentForm.physiotherapistId} onChange={(e) => setAppointmentForm((v) => ({ ...v, physiotherapistId: e.target.value }))}>
            <option value="">Select Physio</option>
            {availablePhysios.map((c) => <option key={c.physioId || c.userId} value={c.physioId || c.userId}>{`${c.name} (${c.physioId || c.userId})`}</option>)}
          </select>
          {noPhysioAvailable ? (
            <p className="text-xs font-medium text-rose-700">
              No physiotherapist is available for the selected date and time slot.
            </p>
          ) : null}
          <select className={inputClass} value={appointmentForm.assignedTo} onChange={(e) => setAppointmentForm((v) => ({ ...v, assignedTo: e.target.value }))}>
            <option value="">Assign Nurse (Optional)</option>
            {availableNurses.map((n) => <option key={n.nurseId || n.userId} value={n.nurseId || n.userId}>{`${n.name} (${n.nurseId || n.userId})`}</option>)}
          </select>
          {noNurseAvailable ? (
            <p className="text-xs font-medium text-amber-700">
              No nurse is free for this slot. You can continue without nurse assignment.
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className={inputClass}
              value={appointmentForm.appointmentType}
              onChange={(e) => setAppointmentForm((v) => ({ ...v, appointmentType: e.target.value }))}
            >
              <option value="WALK_IN">Walk-In</option>
              <option value="VIRTUAL">Virtual</option>
            </select>
            <input
              className={inputClass}
              placeholder="Location"
              value={appointmentForm.location}
              onChange={(e) => setAppointmentForm((v) => ({ ...v, location: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input type="date" min={todayDate} className={inputClass} value={appointmentForm.appointmentDate} onChange={(e) => setAppointmentForm((v) => ({ ...v, appointmentDate: e.target.value }))} />
            <select className={inputClass} value={appointmentForm.timeSlot} onChange={(e) => setAppointmentForm((v) => ({ ...v, timeSlot: e.target.value }))}>
              {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>
          <button className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">{submitting ? "Saving..." : "Book Appointment"}</button>
        </form>
      </motion.section>

      <motion.section className={`mt-6 ${glass} p-6`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h3 className="mb-3 text-lg font-semibold">Search Patient by ID</h3>
        <form onSubmit={searchPatientById} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className={inputClass}
            placeholder="Enter Patient ID (e.g., PT-2026-0001)"
            value={patientSearchId}
            onChange={(e) => setPatientSearchId(e.target.value.toUpperCase())}
          />
          <button className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">Search</button>
        </form>
        {patientSearchResult ? (
          <div className="mt-4 rounded-xl bg-white/70 p-4 text-sm">
            <p><span className="font-semibold">Patient ID:</span> {first(patientSearchResult.patientId)}</p>
            <p><span className="font-semibold">Name:</span> {`${first(patientSearchResult.firstName, "")} ${first(patientSearchResult.lastName, "")}`.trim()}</p>
            <p><span className="font-semibold">Phone:</span> {first(patientSearchResult.phone)}</p>
            <button onClick={() => openPatient(patientSearchResult.patientId)} className="mt-3 rounded-lg bg-cyan-700 px-3 py-1 text-xs font-semibold text-white">
              View Full Patient Details
            </button>
          </div>
        ) : null}
      </motion.section>

      <motion.section className={`mt-6 ${glass} p-6`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h3 className="mb-3 text-lg font-semibold">Pending Appointment Requests</h3>
        <div className="overflow-x-auto rounded-xl bg-white/50">
          <table className="min-w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-left text-slate-600"><th className="px-3 py-2">Req ID</th><th className="px-3 py-2">Patient</th><th className="px-3 py-2">Preferred</th><th className="px-3 py-2">Physio</th><th className="px-3 py-2">Nurse</th><th className="px-3 py-2">Action</th></tr></thead>
            <tbody>
              {pendingRequests.map((r) => (
                <tr key={r.requestId} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-semibold text-cyan-700">{r.requestId}</td>
                  <td className="px-3 py-2">{r.fullName}</td>
                  <td className="px-3 py-2">{`${first(r.preferredDate ? new Date(r.preferredDate).toLocaleDateString() : "-")} ${first(r.preferredTimeSlot)}`}</td>
                  <td className="px-3 py-2"><select className="rounded-lg border border-slate-300 px-2 py-1" value={requestDrafts[r.requestId]?.physiotherapistId || ""} onChange={(e) => setRequestDrafts((p) => ({ ...p, [r.requestId]: { ...p[r.requestId], physiotherapistId: e.target.value } }))}><option value="">Select</option>{consultants.map((c) => <option key={c.physioId || c.userId} value={c.physioId || c.userId}>{c.name}</option>)}</select></td>
                  <td className="px-3 py-2"><select className="rounded-lg border border-slate-300 px-2 py-1" value={requestDrafts[r.requestId]?.assignedTo || ""} onChange={(e) => setRequestDrafts((p) => ({ ...p, [r.requestId]: { ...p[r.requestId], assignedTo: e.target.value } }))}><option value="">Optional</option>{nurses.map((n) => <option key={n.nurseId || n.userId} value={n.nurseId || n.userId}>{`${n.name} (${n.nurseId || n.userId})`}</option>)}</select></td>
                  <td className="px-3 py-2"><button onClick={() => convertRequest(r)} className="rounded-lg bg-cyan-700 px-3 py-1 text-xs font-semibold text-white">Convert</button></td>
                </tr>
              ))}
              {!pendingRequests.length ? <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No pending requests.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </motion.section>

      <motion.section className={`mt-6 ${glass} p-6`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-lg font-semibold">Appointments</h3>
          {["ALL", "PENDING", "SCHEDULED", "COMPLETED"].map((s) => <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-lg px-3 py-1 text-xs font-semibold ${statusFilter === s ? "bg-cyan-600 text-white" : "bg-white text-slate-700"}`}>{s}</button>)}
        </div>
        <div className="overflow-x-auto rounded-xl bg-white/50">
          <table className="min-w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-left text-slate-600"><th className="px-3 py-2">App ID</th><th className="px-3 py-2">Patient ID</th><th className="px-3 py-2">Patient</th><th className="px-3 py-2">Physio</th><th className="px-3 py-2">Nurse</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Time</th><th className="px-3 py-2">Status</th></tr></thead>
            <tbody>
              {filteredAppointments.map((a) => (
                <tr key={a.appointmentId || a._id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{first(a.appointmentId)}</td>
                  <td className="px-3 py-2"><button onClick={() => openPatient(a.patient?.patientId)} className="font-semibold text-cyan-700">{first(a.patient?.patientId)}</button></td>
                  <td className="px-3 py-2">{`${first(a.patient?.firstName, "")} ${first(a.patient?.lastName, "")}`.trim()}</td>
                  <td className="px-3 py-2">{first(a.physiotherapist?.name)}</td>
                  <td className="px-3 py-2">{first(a.assignedTo?.name)}</td>
                  <td className="px-3 py-2">{a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : "-"}</td>
                  <td className="px-3 py-2">{first(a.timeSlot)}</td>
                  <td className="px-3 py-2">{first(a.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      <motion.section className={`mt-6 ${glass} p-6`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h3 className="mb-3 text-lg font-semibold">Today Staff Login/Logout</h3>
        <div className="overflow-x-auto rounded-xl bg-white/50">
          <table className="min-w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-left text-slate-600"><th className="px-3 py-2">Role</th><th className="px-3 py-2">Staff ID</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Login</th><th className="px-3 py-2">Logout</th></tr></thead>
            <tbody>
              {attendance.map((row, idx) => (
                <tr key={`${row.nurseId || row.physioId || row.userId || row.name}-${row.role}-${idx}`} className="border-b border-slate-100">
                  <td className="px-3 py-2">{first(row.role)}</td>
                  <td className="px-3 py-2">{first(row.nurseId || row.physioId || row.userId)}</td>
                  <td className="px-3 py-2">{first(row.name)}</td>
                  <td className="px-3 py-2">{formatIstDateTime(row.loginTime)}</td>
                  <td className="px-3 py-2">{formatIstDateTime(row.logoutTime)}</td>
                </tr>
              ))}
              {!attendance.length ? <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No attendance logs today.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </motion.section>

      {(error || message) ? (
        <section className="mt-4">{error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}{message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}</section>
      ) : null}

      {patientView.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/20 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Patient Details - {first(patientView.patient?.patientId)}</h3><button className="rounded-lg border border-slate-300 px-3 py-1 text-sm" onClick={() => setPatientView({ open: false, patient: null, vitals: [], records: [], appointments: [], loading: false })}>Close</button></div>
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-cyan-50 p-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-cyan-200 bg-white">
                {patientView.patient?.profilePhotoUrl ? (
                  <img src={toAssetUrl(patientView.patient.profilePhotoUrl)} alt="Patient profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    {String(patientView.patient?.gender || "").toLowerCase() === "female" ? "👧" : String(patientView.patient?.gender || "").toLowerCase() === "male" ? "👦" : "🧑"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{`${first(patientView.patient?.firstName, "")} ${first(patientView.patient?.lastName, "")}`.trim()}</p>
                <p className="text-xs text-slate-600">{first(patientView.patient?.patientId)}</p>
              </div>
            </div>
            <div className="mb-4 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-2">
              <p><span className="font-semibold">Name:</span> {`${first(patientView.patient?.firstName, "")} ${first(patientView.patient?.lastName, "")}`.trim()}</p>
              <p><span className="font-semibold">Phone:</span> {first(patientView.patient?.phone)}</p>
              <p><span className="font-semibold">Email:</span> {first(patientView.patient?.email)}</p>
              <p><span className="font-semibold">Gender:</span> {first(patientView.patient?.gender)}</p>
              <p><span className="font-semibold">DOB:</span> {patientView.patient?.dateOfBirth ? new Date(patientView.patient.dateOfBirth).toLocaleDateString("en-GB") : "-"}</p>
              <p><span className="font-semibold">Age:</span> {first(patientView.patient?.age)}</p>
              <p><span className="font-semibold">Blood Group:</span> {first(patientView.patient?.bloodGroup)}</p>
              <p><span className="font-semibold">Address 1:</span> {first(patientView.patient?.addressLine1)}</p>
              <p><span className="font-semibold">Address 2:</span> {first(patientView.patient?.addressLine2)}</p>
              <p><span className="font-semibold">City:</span> {first(patientView.patient?.city)}</p>
              <p><span className="font-semibold">State:</span> {first(patientView.patient?.state)}</p>
              <p><span className="font-semibold">Postal Code:</span> {first(patientView.patient?.postalCode)}</p>
              <p><span className="font-semibold">Country:</span> {first(patientView.patient?.country)}</p>
              <p><span className="font-semibold">Emergency Contact:</span> {first(patientView.patient?.emergencyContactName)}</p>
              <p><span className="font-semibold">Relationship:</span> {first(patientView.patient?.emergencyContactRelationship)}</p>
              <p><span className="font-semibold">Emergency Phone:</span> {first(patientView.patient?.emergencyContactPhone)}</p>
              <p><span className="font-semibold">Insurance Provider:</span> {first(patientView.patient?.insuranceProvider)}</p>
              <p><span className="font-semibold">Insurance Number:</span> {first(patientView.patient?.insuranceNumber)}</p>
              <p className="md:col-span-2"><span className="font-semibold">Allergies:</span> {Array.isArray(patientView.patient?.allergies) ? patientView.patient.allergies.join(", ") || "-" : "-"}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><h4 className="mb-2 font-semibold">Vitals</h4><div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">{patientView.loading ? "Loading..." : patientView.vitals.length ? patientView.vitals.slice(0, 6).map((v) => <div key={v._id} className="mb-2 border-b border-slate-100 pb-2"><p>{new Date(v.recordedAt || v.createdAt).toLocaleString("en-IN")}</p><p>Nurse: {first(v?.recordedBy?.name)} ({first(v?.recordedBy?.nurseId || v?.recordedBy?.userId)})</p><p>BP: {first(v.bloodPressure)}</p><p>Pulse: {first(v.pulse)}</p><p>Temp: {first(v.temperature)}</p></div>) : "No vitals found."}</div></div>
              <div><h4 className="mb-2 font-semibold">Uploaded Files</h4><div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">{patientView.loading ? "Loading..." : patientView.records.length ? patientView.records.slice(0, 8).map((r) => <div key={r._id} className="mb-2 border-b border-slate-100 pb-2"><p>{first(r.recordType || r.category)}</p><p>{first(r.fileName || r.originalName)}</p></div>) : "No uploaded records found."}</div></div>
            </div>
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">Appointment History</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="px-3 py-2">Appointment ID</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Physio</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientView.appointments?.length ? patientView.appointments.map((a) => (
                      <tr key={a.appointmentId || a._id} className="border-b border-slate-100">
                        <td className="px-3 py-2">{first(a.appointmentId)}</td>
                        <td className="px-3 py-2">{a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString("en-GB") : "-"}</td>
                        <td className="px-3 py-2">{first(a.timeSlot)}</td>
                        <td className="px-3 py-2">{first(a.physiotherapist?.name)}</td>
                        <td className="px-3 py-2">{first(a.status)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-500">No appointments found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
