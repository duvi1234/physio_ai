import api from "./api";

export const adminApiExamples = {
  getPatients: (search = "") =>
    api.get(`/patient${search ? `?search=${encodeURIComponent(search)}` : ""}`).catch(() => api.get("/patients/search?q=")),
  createPatient: (payload) => api.post("/patient", payload).catch(() => api.post("/patients", payload)),
  updatePatient: (id, payload) => api.put(`/patient/${id}`, payload).catch(() => api.put(`/patients/${id}`, payload)),
  getAppointments: (query = "") => api.get(`/appointment${query ? `?${query}` : ""}`).catch(() => api.get("/appointments/my")),
  createAppointment: (payload) => api.post("/appointment", payload).catch(() => api.post("/appointments", payload)),
  getAppointmentRequests: () => api.get("/appointmentRequest").catch(() => api.get("/requests")),
  convertAppointmentRequest: (requestId, payload) =>
    api.post(`/appointmentRequest/${requestId}/convert`, payload).catch(() => api.post(`/requests/${requestId}/convert`, payload)),
  getConsultants: () => api.get("/consultant").catch(() => api.get("/consultants")),
  getNurses: () => api.get("/user?role=NURSE").catch(() => api.get("/users?role=NURSE")),
  createNurse: (payload) => api.post("/user/create-nurse", payload).catch(() => api.post("/users/create-nurse", payload)),
  createPhysio: (payload) => api.post("/user/create-physio", payload).catch(() => api.post("/users/create-physio", payload))
};

export const nurseApiExamples = {
  getAssignedAppointments: (nurseId) =>
    api.get(`/appointment?assignedTo=${nurseId}`).catch(() => api.get("/appointments/my")),
  recordVitals: (payload) => api.post("/nurse/vitals", payload),
  getVitals: (patientId) =>
    api.get(`/nurse/vitals${patientId ? `?patientId=${patientId}` : ""}`).catch(() => api.get(`/nurse/vitals/${patientId}`))
};

export const consultantApiExamples = {
  getAppointments: (id) =>
    api.get(`/appointment?consultantId=${id}`).catch(() => api.get("/consultant/appointments/pending")),
  getPatientVitals: (id) =>
    api.get(`/nurse/vitals?patientId=${id}`).catch(() => api.get(`/nurse/vitals/${id}`)),
  addConsultation: (payload) =>
    api.post("/consultation", payload).catch(() => api.post(`/consultant/patients/${payload.patientId}/consultation`, payload))
};

export const patientApiExamples = {
  getAppointments: (id) =>
    api.get(`/appointment?patientId=${id}`).catch(() => api.get("/appointments/my")),
  createAppointment: (payload) => api.post("/appointment", payload).catch(() => api.post("/appointments", payload)),
  getVitals: () => api.get("/nurse/vitals"),
  uploadMedicalRecord: (formData) =>
    api.post("/medicalRecords/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }).catch(() =>
      api.post("/medical-records/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
    )
};
