import api from "./api";

const BASE = "/medical-records";

export const uploadMedicalRecord = (formData) =>
  api.post(BASE, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

export const getPatientRecords = (patientId) =>
  api.get(`${BASE}/patient/${patientId}`);

export const deleteMedicalRecord = (id) =>
  api.delete(`${BASE}/${id}`);
