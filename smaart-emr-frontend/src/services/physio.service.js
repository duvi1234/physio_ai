import api from "./api";

const toArray = (payload) => {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const toObject = (payload) => {
  if (payload?.data?.data && typeof payload.data.data === "object") return payload.data.data;
  if (payload?.data && typeof payload.data === "object") return payload.data;
  if (payload && typeof payload === "object") return payload;
  return {};
};

const physioService = {
  getDashboard: () => api.get("/physio/dashboard").then(toObject),
  getAppointments: (params = {}) => api.get("/physio/appointments", { params }).then(toArray),
  updateAppointmentStatus: (appointmentId, status) =>
    api.patch(`/physio/appointments/${encodeURIComponent(appointmentId)}/status`, { status }).then(toObject),
  getPatientCase: (patientId) => api.get(`/physio/patient/${encodeURIComponent(patientId)}`).then(toObject),
  createPostureAnalysis: (payload) => api.post("/physio/posture-analysis", payload).then(toObject),
  createTreatmentPlan: (payload) => api.post("/physio/treatment-plan", payload).then(toObject),
  createSessionNote: (payload) => api.post("/physio/session-notes", payload).then(toObject),
  getAnalytics: (patientId) => api.get(`/physio/analytics/${encodeURIComponent(patientId)}`).then(toObject),
  getProfile: () => api.get("/physio/profile").then(toObject),
  updateProfile: (payload) => api.put("/physio/profile", payload).then(toObject)
};

export default physioService;
