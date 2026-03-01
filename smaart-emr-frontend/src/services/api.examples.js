import api from "./api";

const fallbackOnNotFound = (primary, fallback) =>
  primary.catch((err) => (err?.response?.status === 404 ? fallback() : Promise.reject(err)));

export const adminApiExamples = {
  getPatients: (search = "") =>
    fallbackOnNotFound(
      api.get(`/patient${search ? `?search=${encodeURIComponent(search)}` : ""}`),
      () => api.get("/patients/search?q=")
    ),
  createPatient: (payload) => fallbackOnNotFound(api.post("/patient", payload), () => api.post("/patients", payload)),
  updatePatient: (id, payload) =>
    fallbackOnNotFound(api.put(`/patient/${id}`, payload), () => api.put(`/patients/${id}`, payload)),
  getAppointments: (query = "") =>
    fallbackOnNotFound(api.get(`/appointment${query ? `?${query}` : ""}`), () => api.get("/appointments/my")),
  createAppointment: (payload) =>
    fallbackOnNotFound(api.post("/appointment", payload), () => api.post("/appointments", payload)),
  getAppointmentRequests: () => fallbackOnNotFound(api.get("/appointmentRequest"), () => api.get("/requests")),
  getConsultants: () => fallbackOnNotFound(api.get("/consultant"), () => api.get("/consultants")),
  getNurses: () => fallbackOnNotFound(api.get("/user?role=NURSE"), () => api.get("/users?role=NURSE")),
  createNurse: (payload) =>
    fallbackOnNotFound(api.post("/user/create-nurse", payload), () => api.post("/users/create-nurse", payload)),
  createPhysio: (payload) =>
    fallbackOnNotFound(api.post("/user/create-physio", payload), () => api.post("/users/create-physio", payload)),
  getStaffAttendanceToday: () =>
    fallbackOnNotFound(api.get("/user/staff-attendance"), () => api.get("/users/staff-attendance")),
  getPatientVitals: (patientId) => api.get(`/nurse/vitals?patientId=${encodeURIComponent(patientId)}`),
  getPatientRecords: (patientId) => api.get(`/medicalRecords?patientId=${encodeURIComponent(patientId)}`),
  convertAppointmentRequest: (requestId, payload) =>
    fallbackOnNotFound(api.post(`/appointmentRequest/${requestId}/convert`, payload), () =>
      api.post(`/requests/${requestId}/convert`, payload)
    )
};

export const nurseApiExamples = {
  getAssignedAppointments: (nurseId) =>
    fallbackOnNotFound(api.get(`/appointment?assignedTo=${nurseId}`), () => api.get("/appointments/my")),
  recordVitals: (payload) => api.post("/nurse/vitals", payload),
  getVitals: (patientId) =>
    fallbackOnNotFound(api.get(`/nurse/vitals${patientId ? `?patientId=${patientId}` : ""}`), () =>
      api.get(`/nurse/vitals/${patientId}`)
    )
};

export const consultantApiExamples = {
  getAppointments: (id) =>
    fallbackOnNotFound(api.get(`/appointment?consultantId=${id}`), () => api.get("/consultant/appointments/pending")),
  getPatientVitals: (id) =>
    fallbackOnNotFound(api.get(`/nurse/vitals?patientId=${id}`), () => api.get(`/nurse/vitals/${id}`)),
  addConsultation: (payload) =>
    fallbackOnNotFound(api.post("/consultation", payload), () =>
      api.post(`/consultant/patients/${payload.patientId}/consultation`, payload)
    )
};

export const patientApiExamples = {
  getProfile: () => api.get("/patient/me"),
  updateProfile: (payload) => api.put("/patient/me", payload),
  uploadProfilePhoto: (formData) =>
    api.post("/patient/me/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  getConsultants: () => fallbackOnNotFound(api.get("/consultant"), () => api.get("/consultants")),
  getAppointments: (id) => {
    const normalized = String(id || "").trim();
    const endpoint = normalized ? `/appointment?patientId=${encodeURIComponent(normalized)}` : "/appointment";
    return fallbackOnNotFound(api.get(endpoint), () => api.get("/appointments/my"));
  },
  createAppointment: (payload) =>
    fallbackOnNotFound(api.post("/appointment", payload), () => api.post("/appointments", payload)),
  getVitals: () => api.get("/nurse/vitals"),
  uploadMedicalRecord: (formData) =>
    fallbackOnNotFound(
      api.post("/medicalRecords/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }),
      () =>
        api.post("/medical-records/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
    )
};
