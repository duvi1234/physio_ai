import api from "./api";

const unwrapArray = (payload) => {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const unwrapObject = (payload) => {
  if (payload?.data?.data && typeof payload.data.data === "object") return payload.data.data;
  if (payload?.data && typeof payload.data === "object") return payload.data;
  if (payload && typeof payload === "object") return payload;
  return {};
};

const toQuery = (query = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  const q = params.toString();
  return q ? `?${q}` : "";
};

const painService = {
  create: (payload, options = {}) =>
    api
      .post("/pain", payload, {
        headers: options.idempotencyKey
          ? { "x-idempotency-key": options.idempotencyKey }
          : undefined
      })
      .then(unwrapObject),
  listByPatient: (patientId, query = {}) =>
    api.get(`/pain/${encodeURIComponent(patientId)}${toQuery(query)}`).then(unwrapArray),
  getTimeline: (patientId, query = {}) =>
    api.get(`/pain/${encodeURIComponent(patientId)}/timeline${toQuery(query)}`).then(unwrapObject),
  getReport: (patientId, query = {}) =>
    api.get(`/pain/${encodeURIComponent(patientId)}/report${toQuery(query)}`).then(unwrapObject)
};

export default painService;
