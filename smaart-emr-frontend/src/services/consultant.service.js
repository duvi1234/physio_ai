import api from "./api";

const BASE = "/consultant";

export const getMyProfile = () =>
  api.get(`${BASE}/me`);

export const getMyPatients = () =>
  api.get(`${BASE}/patients`);

export const getPatientVitals = (patientId) =>
  api.get(`${BASE}/patients/${patientId}/vitals`);

export const addConsultationNote = (patientId, data) =>
  api.post(`${BASE}/patients/${patientId}/consultation`, data);

export const getPendingAppointments = () =>
  api.get(`${BASE}/appointments/pending`);

export const acceptAppointment = (id) =>
  api.patch(`${BASE}/appointments/${id}/accept`);

export const rejectAppointment = (id) =>
  api.patch(`${BASE}/appointments/${id}/reject`);

export const getDashboardStats = () =>
  api.get(`${BASE}/dashboard/stats`);
