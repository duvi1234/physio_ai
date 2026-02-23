import api from "./api";

const BASE = "/patients";

export const createPatient = (data) =>
  api.post(BASE, data);

export const searchPatients = (query) =>
  api.get(`${BASE}/search?q=${query}`);

export const getPatient = (patientId) =>
  api.get(`${BASE}/${patientId}`);

export const updatePatient = (patientId, data) =>
  api.put(`${BASE}/${patientId}`, data);
