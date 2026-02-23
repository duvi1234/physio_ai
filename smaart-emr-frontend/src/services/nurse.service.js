import api from "./api";

const BASE = "/nurse";

export const recordVitals = (data) =>
  api.post(`${BASE}/vitals`, data);

export const getPatientVitals = (patientId) =>
  api.get(`${BASE}/vitals/${patientId}`);
