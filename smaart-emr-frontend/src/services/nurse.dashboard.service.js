import api from "./api";
import { toArray } from "../pages/nurse/nurse.ui";

const fallbackOnNotFound = (primary, fallback) =>
  primary.catch((err) => (err?.response?.status === 404 ? fallback() : Promise.reject(err)));

const toObject = (payload) => {
  if (payload?.data?.data && typeof payload.data.data === "object") return payload.data.data;
  if (payload?.data && typeof payload.data === "object") return payload.data;
  if (payload && typeof payload === "object") return payload;
  return {};
};

export const nurseDashboardService = {
  getDashboardStats: () => api.get("/nurse/dashboard").then(toObject),

  getAssignedAppointments: (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return fallbackOnNotFound(api.get(`/nurse/appointments${suffix}`), () =>
      fallbackOnNotFound(api.get(`/appointments/today${suffix}`), () =>
        api.get(`/appointment?assignedTo=${encodeURIComponent(filters.assignedTo || "")}&date=${encodeURIComponent(filters.date || "")}`)
      )
    ).then(toArray);
  },

  updateAssignedAppointmentStatus: ({ appointmentId, status, notes }) =>
    api.patch(`/nurse/appointments/${encodeURIComponent(appointmentId)}/status`, { status, notes }).then(toObject),

  getAssignedPatients: (search = "") =>
    api.get(`/nurse/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`).then(toArray),
  getAssignedPatientSummary: (date = "") =>
    api.get(`/nurse/assigned-patients${date ? `?date=${encodeURIComponent(date)}` : ""}`).then(toArray),

  getTodayAppointments: (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return fallbackOnNotFound(api.get(`/appointments/today${suffix}`), () =>
      fallbackOnNotFound(api.get(`/appointment?date=${filters.date || ""}&assignedTo=${filters.assignedTo || ""}`), () =>
        api.get("/appointment")
      )
    ).then(toArray);
  },

  getAppointmentsByPatient: (patientId) =>
    fallbackOnNotFound(api.get(`/appointments/patient/${encodeURIComponent(patientId)}`), () =>
      api.get(`/appointment?patientId=${encodeURIComponent(patientId)}`)
    ).then(toArray),

  updateAppointmentStatus: ({ appointmentId, status }) =>
    fallbackOnNotFound(api.patch("/appointments/status", { appointmentId, status }), () =>
      fallbackOnNotFound(api.patch("/appointment/status", { appointmentId, status }), () =>
        api.patch(`/appointment/${encodeURIComponent(appointmentId)}/status`, { status })
      )
    ).then(toObject),

  checkInAppointment: (payload) =>
    fallbackOnNotFound(api.patch("/appointments/checkin", payload), () =>
      api.patch("/appointment/checkin", payload)
    ).then(toObject),

  searchPatients: (search = "") =>
    fallbackOnNotFound(api.get(`/patients/search?q=${encodeURIComponent(search)}`), () =>
      api.get(`/patient/search?q=${encodeURIComponent(search)}`)
    ).then(toArray),

  getPatient: (patientId) =>
    fallbackOnNotFound(api.get(`/patients/${encodeURIComponent(patientId)}`), () =>
      api.get(`/patient/${encodeURIComponent(patientId)}`)
    ).then(toObject),

  getPatientTimeline: (patientId) =>
    fallbackOnNotFound(api.get(`/patients/${encodeURIComponent(patientId)}/timeline`), () =>
      api.get(`/patient/${encodeURIComponent(patientId)}/timeline`)
    ).then(toObject),

  recordVitals: (payload) => api.post("/nurse/vitals", payload).then(toObject),
  listVitals: (patientId = "") =>
    api.get(`/nurse/vitals${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ""}`).then(toArray),
  getPatientVitals: (patientId) =>
    fallbackOnNotFound(api.get(`/nurse/vitals/${encodeURIComponent(patientId)}`), () =>
      api.get(`/nurse/vitals?patientId=${encodeURIComponent(patientId)}`)
    ).then(toArray),
  updateVitals: (vitalsId, payload) => api.put(`/nurse/vitals/${encodeURIComponent(vitalsId)}`, payload).then(toObject),
  deleteVitals: (vitalsId) => api.delete(`/nurse/vitals/${encodeURIComponent(vitalsId)}`).then(toObject),

  createPainAssessment: (payload) => api.post("/nurse/assessments", payload).then(toObject),
  listPainAssessments: (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/nurse/assessments${suffix}`).then(toArray);
  },
  updatePainAssessment: (id, payload) => api.put(`/nurse/assessments/${encodeURIComponent(id)}`, payload).then(toObject),
  deletePainAssessment: (id) => api.delete(`/nurse/assessments/${encodeURIComponent(id)}`).then(toObject),

  createNote: (payload) => api.post("/nurse/notes", payload).then(toObject),
  listNotes: (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/nurse/notes${suffix}`).then(toArray);
  },
  updateNote: (id, payload) => api.put(`/nurse/notes/${encodeURIComponent(id)}`, payload).then(toObject),
  deleteNote: (id) => api.delete(`/nurse/notes/${encodeURIComponent(id)}`).then(toObject),

  updateProfile: (payload) => api.put("/nurse/profile", payload).then(toObject),

  updateMedicalHistory: (payload) =>
    fallbackOnNotFound(api.patch("/patients/medical-history", payload), () => api.patch("/patient/medical-history", payload)).then(
      toObject
    ),

  uploadMedicalRecord: (formData) =>
    fallbackOnNotFound(
      api.post("/medicalRecords/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }),
      () =>
        api.post("/medical-records/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
    ).then(toObject),

  getMedicalRecords: (patientId) =>
    fallbackOnNotFound(api.get(`/medicalRecords?patientId=${encodeURIComponent(patientId)}`), () =>
      api.get(`/medical-records/patient/${encodeURIComponent(patientId)}`)
    ).then(toArray),

  deleteMedicalRecord: (recordId) =>
    fallbackOnNotFound(api.delete(`/medicalRecords/${encodeURIComponent(recordId)}`), () =>
      api.delete(`/medical-records/${encodeURIComponent(recordId)}`)
    ).then(toObject),

  getTodayAlerts: (patientId = "") => {
    const suffix = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
    return fallbackOnNotFound(api.get(`/alerts/today${suffix}`), () => api.get(`/alert/today${suffix}`)).then(toArray);
  },

  createAlert: (payload) => fallbackOnNotFound(api.post("/alerts", payload), () => api.post("/alert", payload)).then(toObject)
};

export default nurseDashboardService;
