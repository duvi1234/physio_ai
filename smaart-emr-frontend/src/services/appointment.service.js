import api from "./api";

const BASE = "/appointments";

export const createAppointment = (data) =>
  api.post(BASE, data);

export const getMyAppointments = () =>
  api.get(`${BASE}/my`);

export const updateAppointmentStatus = (id, status) =>
  api.patch(`${BASE}/${id}/status`, { status });
