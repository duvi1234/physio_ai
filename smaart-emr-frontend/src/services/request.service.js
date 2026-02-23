import api from "./api";

const BASE = "/requests";

export const createRequest = (data) =>
  api.post(BASE, data);

export const getAllRequests = () =>
  api.get(BASE);

export const updateRequestStatus = (id, status) =>
  api.patch(`${BASE}/${id}`, { status });

export const convertRequestToAppointment = (requestId, payload) =>
  api.post(`${BASE}/${requestId}/convert`, payload);
