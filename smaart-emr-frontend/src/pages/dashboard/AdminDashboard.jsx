import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, CalendarDays, ClipboardList, Stethoscope } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { adminApiExamples } from "../../services/api.examples";

const glass = "bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20";
const inputClass = "w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200";

const toArray = (res) => (Array.isArray(res?.data?.data) ? res.data.data : []);

const timeSlots = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00"
];

const first = (value, fallback = "-") => (value === undefined || value === null || value === "" ? fallback : value);

const paginate = (rows, page, pageSize) => {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
};

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
const isValidPhone = (phone) => /^\+?[0-9]{8,15}$/.test(phone);

const emptyPatientForm = { name: "", phone: "", email: "", gender: "Other", dateOfBirth: "2000-01-01", address: "" };
const emptyNurseForm = { name: "", phone: "", email: "" };
const emptyPhysioForm = { name: "", phone: "", email: "", specialization: "Physiotherapy" };
const emptyAppointment = { patientId: "", physiotherapistId: "", assignedTo: "", appointmentDate: "", timeSlot: "09:00 - 10:00", location: "Main Clinic", appointmentType: "WALK_IN" };

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [nurses, setNurses] = useState([]);

  const [tab, setTab] = useState("nurses");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [nurseForm, setNurseForm] = useState(emptyNurseForm);
  const [physioForm, setPhysioForm] = useState(emptyPhysioForm);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientsRes, appointmentsRes, requestsRes, consultantsRes, nursesRes] = await Promise.all([
        adminApiExamples.getPatients(),
        adminApiExamples.getAppointments(),
        adminApiExamples.getAppointmentRequests(),
        adminApiExamples.getConsultants(),
        adminApiExamples.getNurses()
      ]);
      setPatients(toArray(patientsRes));
      setAppointments(toArray(appointmentsRes));
      setRequests(toArray(requestsRes));
      setConsultants(toArray(consultantsRes));
      setNurses(toArray(nursesRes));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter((a) => new Date(a.appointmentDate).toDateString() === today).length;
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    return appointments.filter((a) => new Date(a.appointmentDate).getTime() > now).length;
  }, [appointments]);

  const completedAppointments = useMemo(
    () => appointments.filter((a) => String(a.status || "").toUpperCase() === "COMPLETED").length,
    [appointments]
  );

  const filteredNurses = useMemo(() => {
    const q = search.toLowerCase().trim();
    return nurses.filter((n) =>
      [n.nurseId, n.name, n.email, n.phone].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [nurses, search]);

  const filteredPhysios = useMemo(() => {
    const q = search.toLowerCase().trim();
    return consultants.filter((p) =>
      [p.physioId, p.userId, p.name, p.email, p.phone].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [consultants, search]);

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase().trim();
    return patients.filter((p) =>
      [p.patientId, p.firstName, p.lastName, p.email, p.phone].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [patients, search]);

  const activeRows = tab === "nurses" ? filteredNurses : tab === "physios" ? filteredPhysios : filteredPatients;
  const pagedRows = paginate(activeRows, page, pageSize);
  const pageCount = Math.max(1, Math.ceil(activeRows.length / pageSize));

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

  const canCreatePatient = patientForm.name.trim() && isValidPhone(patientForm.phone) && (!patientForm.email || isValidEmail(patientForm.email));
  const canCreateNurse = nurseForm.name.trim() && isValidPhone(nurseForm.phone) && isValidEmail(nurseForm.email);
  const canCreatePhysio = physioForm.name.trim() && isValidPhone(physioForm.phone) && isValidEmail(physioForm.email);
  const canBookAppointment = appointmentForm.patientId && appointmentForm.physiotherapistId && appointmentForm.appointmentDate && appointmentForm.timeSlot;

  const createPatient = (e) => {
    e.preventDefault();
    if (!canCreatePatient) return;
    withSubmit(async () => {
      const res = await adminApiExamples.createPatient(patientForm);
      const generatedId = res?.data?.data?.patientId;
      setMessage(`Patient Created Successfully. Generated ID: ${first(generatedId)}`);
      setPatientForm(emptyPatientForm);
    });
  };

  const createNurse = (e) => {
    e.preventDefault();
    if (!canCreateNurse) return;
    withSubmit(async () => {
      const res = await adminApiExamples.createNurse(nurseForm);
      const generatedId = res?.data?.data?.nurseId || res?.data?.data?.userId;
      setMessage(`Nurse Created Successfully. Generated ID: ${first(generatedId)}`);
      setNurseForm(emptyNurseForm);
    });
  };

  const createPhysio = (e) => {
    e.preventDefault();
    if (!canCreatePhysio) return;
    withSubmit(async () => {
      const res = await adminApiExamples.createPhysio(physioForm);
      const generatedId = res?.data?.data?.physioId || res?.data?.data?.userId;
      setMessage(`Physiotherapist Created Successfully. Generated ID: ${first(generatedId)}`);
      setPhysioForm(emptyPhysioForm);
    });
  };

  const bookAppointment = (e) => {
    e.preventDefault();
    if (!canBookAppointment) return;
    withSubmit(async () => {
      await adminApiExamples.createAppointment(appointmentForm);
      setMessage("Appointment Created Successfully.");
      setAppointmentForm(emptyAppointment);
    });
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Patients", value: patients.length, icon: Users },
          { title: "Today Appointments", value: todayAppointments, icon: CalendarDays },
          { title: "Pending Requests", value: requests.filter((r) => String(r.status || "").toUpperCase() === "PENDING").length, icon: ClipboardList },
          { title: "Physiotherapists", value: consultants.length, icon: Stethoscope }
        ].map((card) => (
          <motion.div key={card.title} className={`${glass} p-6`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <card.icon className="mb-3 text-cyan-700" size={20} />
            <p className="text-sm text-slate-600">{card.title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{loading ? "..." : card.value}</p>
          </motion.div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <form className={`${glass} p-6 space-y-3`} onSubmit={createNurse}>
          <h3 className="text-lg font-semibold tracking-tight">Create Nurse</h3>
          <input className={inputClass} placeholder="Full Name *" value={nurseForm.name} onChange={(e) => setNurseForm((v) => ({ ...v, name: e.target.value }))} />
          <input className={inputClass} placeholder="Phone *" value={nurseForm.phone} onChange={(e) => setNurseForm((v) => ({ ...v, phone: e.target.value }))} />
          <input className={inputClass} placeholder="Email *" value={nurseForm.email} onChange={(e) => setNurseForm((v) => ({ ...v, email: e.target.value }))} />
          {!isValidPhone(nurseForm.phone || "1") ? <p className="text-xs text-rose-600">Enter valid phone.</p> : null}
          {nurseForm.email && !isValidEmail(nurseForm.email) ? <p className="text-xs text-rose-600">Enter valid email.</p> : null}
          <button disabled={!canCreateNurse || submitting} className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Creating..." : "Create Nurse"}
          </button>
        </form>

        <form className={`${glass} p-6 space-y-3`} onSubmit={createPhysio}>
          <h3 className="text-lg font-semibold tracking-tight">Create Physiotherapist</h3>
          <input className={inputClass} placeholder="Full Name *" value={physioForm.name} onChange={(e) => setPhysioForm((v) => ({ ...v, name: e.target.value }))} />
          <input className={inputClass} placeholder="Phone *" value={physioForm.phone} onChange={(e) => setPhysioForm((v) => ({ ...v, phone: e.target.value }))} />
          <input className={inputClass} placeholder="Email *" value={physioForm.email} onChange={(e) => setPhysioForm((v) => ({ ...v, email: e.target.value }))} />
          <select className={inputClass} value={physioForm.specialization} onChange={(e) => setPhysioForm((v) => ({ ...v, specialization: e.target.value }))}>
            <option>Physiotherapy</option>
            <option>Sports Rehab</option>
            <option>Neuro Rehab</option>
            <option>Ortho Rehab</option>
          </select>
          <button disabled={!canCreatePhysio || submitting} className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Creating..." : "Create Physiotherapist"}
          </button>
        </form>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <form className={`${glass} p-6 space-y-3`} onSubmit={createPatient}>
          <h3 className="text-lg font-semibold tracking-tight">Create Patient</h3>
          <input className={inputClass} placeholder="Full Name *" value={patientForm.name} onChange={(e) => setPatientForm((v) => ({ ...v, name: e.target.value }))} />
          <input className={inputClass} placeholder="Phone *" value={patientForm.phone} onChange={(e) => setPatientForm((v) => ({ ...v, phone: e.target.value }))} />
          <input className={inputClass} placeholder="Email" value={patientForm.email} onChange={(e) => setPatientForm((v) => ({ ...v, email: e.target.value }))} />
          <select className={inputClass} value={patientForm.gender} onChange={(e) => setPatientForm((v) => ({ ...v, gender: e.target.value }))}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input type="date" className={inputClass} value={patientForm.dateOfBirth} onChange={(e) => setPatientForm((v) => ({ ...v, dateOfBirth: e.target.value }))} />
          <input className={inputClass} placeholder="Address" value={patientForm.address} onChange={(e) => setPatientForm((v) => ({ ...v, address: e.target.value }))} />
          <button disabled={!canCreatePatient || submitting} className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Creating..." : "Create Patient"}
          </button>
        </form>

        <form className={`${glass} p-6 space-y-3`} onSubmit={bookAppointment}>
          <h3 className="text-lg font-semibold tracking-tight">Create Appointment</h3>
          <input className={inputClass} placeholder="Patient ID *" value={appointmentForm.patientId} onChange={(e) => setAppointmentForm((v) => ({ ...v, patientId: e.target.value.toUpperCase() }))} />
          <select className={inputClass} value={appointmentForm.physiotherapistId} onChange={(e) => setAppointmentForm((v) => ({ ...v, physiotherapistId: e.target.value }))}>
            <option value="">Select Physiotherapist *</option>
            {consultants.map((c) => (
              <option key={c.userId || c.physioId} value={c.physioId || c.userId}>{`${c.name || "-"} (${c.physioId || c.userId || "-"})`}</option>
            ))}
          </select>
          <select className={inputClass} value={appointmentForm.assignedTo} onChange={(e) => setAppointmentForm((v) => ({ ...v, assignedTo: e.target.value }))}>
            <option value="">Assign Nurse (Optional)</option>
            {nurses.map((n) => (
              <option key={n.userId || n.nurseId} value={n.nurseId || n.userId}>{`${n.name || "-"} (${n.nurseId || n.userId || "-"})`}</option>
            ))}
          </select>
          <input type="date" className={inputClass} value={appointmentForm.appointmentDate} onChange={(e) => setAppointmentForm((v) => ({ ...v, appointmentDate: e.target.value }))} />
          <select className={inputClass} value={appointmentForm.timeSlot} onChange={(e) => setAppointmentForm((v) => ({ ...v, timeSlot: e.target.value }))}>
            {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </select>
          <select className={inputClass} value={appointmentForm.appointmentType} onChange={(e) => setAppointmentForm((v) => ({ ...v, appointmentType: e.target.value }))}>
            <option value="WALK_IN">Walk-In</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
          <input className={inputClass} placeholder="Location" value={appointmentForm.location} onChange={(e) => setAppointmentForm((v) => ({ ...v, location: e.target.value }))} />
          <button disabled={!canBookAppointment || submitting} className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Scheduling..." : "Book Appointment"}
          </button>
        </form>
      </section>

      <section className={`mt-6 ${glass} p-6`}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold tracking-tight">Staff Management</h3>
          <div className="inline-flex rounded-xl bg-white/60 p-1">
            {[
              { key: "nurses", label: "Nurses" },
              { key: "physios", label: "Physiotherapists" },
              { key: "patients", label: "Patients" }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`rounded-lg px-3 py-1 text-sm font-semibold ${tab === item.key ? "bg-cyan-600 text-white" : "text-slate-700 hover:bg-white"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            className={`ml-auto max-w-md ${inputClass}`}
            placeholder="Search by ID or Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-xl bg-white/50">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-4 py-3">Auto ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => {
                const autoId = tab === "nurses" ? row.nurseId || row.userId : tab === "physios" ? row.physioId || row.userId : row.patientId;
                const name = tab === "patients" ? `${first(row.firstName, "")} ${first(row.lastName, "")}`.trim() : row.name;
                return (
                  <tr key={`${autoId}-${row.email || row.phone}`} className="border-b border-slate-100 text-slate-800">
                    <td className="px-4 py-3 font-semibold text-cyan-700">{first(autoId)}</td>
                    <td className="px-4 py-3">{first(name)}</td>
                    <td className="px-4 py-3">{first(row.email)}</td>
                    <td className="px-4 py-3">{first(row.phone)}</td>
                  </tr>
                );
              })}
              {!pagedRows.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No records found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
          <p>
            Showing {activeRows.length ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, activeRows.length)} of {activeRows.length}
          </p>
          <div className="inline-flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg bg-white px-3 py-1 disabled:opacity-50">Prev</button>
            <span className="px-2 py-1">{page} / {pageCount}</span>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="rounded-lg bg-white px-3 py-1 disabled:opacity-50">Next</button>
          </div>
        </div>
      </section>

      <section className={`mt-6 ${glass} p-6`}>
        <h3 className="mb-3 text-lg font-semibold tracking-tight">Appointment Summary</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-white/70 p-3 text-sm text-slate-700">Today: <span className="font-semibold">{todayAppointments}</span></div>
          <div className="rounded-xl bg-white/70 p-3 text-sm text-slate-700">Upcoming: <span className="font-semibold">{upcomingAppointments}</span></div>
          <div className="rounded-xl bg-white/70 p-3 text-sm text-slate-700">Completed: <span className="font-semibold">{completedAppointments}</span></div>
        </div>
      </section>

      {(error || message) ? (
        <section className="mt-4">
          {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        </section>
      ) : null}
    </DashboardLayout>
  );
}
