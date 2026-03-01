import api, { AUTH_STORAGE_KEYS } from "./api";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const FALLBACK_NAMESPACE = "smaartPatientModule";

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

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const getPatientIdentity = () => {
  const user = getStoredUser();
  return {
    mongoId: user?.id || user?._id || "",
    patientId: user?.patientId || user?.userId || "",
    user
  };
};

const storageKey = (name, patientRef = "self") => `${FALLBACK_NAMESPACE}:${name}:${patientRef}`;

const readLocal = (name, patientRef = "self", fallback = []) => {
  try {
    const raw = localStorage.getItem(storageKey(name, patientRef));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = (name, patientRef = "self", value) => {
  localStorage.setItem(storageKey(name, patientRef), JSON.stringify(value));
};

const tryRequest = async (requestFn, { allowStatuses = [404] } = {}) => {
  try {
    return await requestFn();
  } catch (err) {
    const status = err?.response?.status;
    if (allowStatuses.includes(status)) return null;
    throw err;
  }
};

export const toAssetUrl = (filePath = "") => {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const normalized = String(filePath).replace(/\\/g, "/");
  const uploadsIndex = normalized.toLowerCase().indexOf("uploads/");
  const relative = uploadsIndex >= 0 ? normalized.slice(uploadsIndex) : normalized.replace(/^\/+/, "");
  return `${API_BASE}/${relative.replace(/^\/+/, "")}`;
};

const normalizeSession = (row = {}) => {
  const sessionDateRaw = row?.appointmentDate || row?.date || row?.createdAt;
  const sessionDate = sessionDateRaw ? new Date(sessionDateRaw) : null;
  const consultationNotes = row?.consultation?.notes || row?.notes || "";
  return {
    ...row,
    id: row?._id || row?.appointmentId,
    sessionDate,
    consultationNotes,
    sessionStatus: String(row?.status || "PENDING").toUpperCase()
  };
};

const defaultTreatmentPlan = (patientRef) => ({
  id: `TP-${patientRef || "SELF"}`,
  diagnosis: "Mechanical lower back pain with postural imbalance",
  rehabGoals: [
    "Reduce pain and improve range of motion",
    "Improve core stability and posture control",
    "Restore functional mobility"
  ],
  recoveryStage: "Phase 1 - Mobility & Pain Control",
  durationWeeks: 6,
  physiotherapistRemarks: "Follow supervised home exercise protocol and report pain escalation.",
  exercises: [
    {
      id: "ex-1",
      name: "Pelvic Tilt",
      sets: 3,
      reps: 12,
      frequency: "Daily",
      safetyNotes: "Avoid breath holding. Stop if sharp pain.",
      completed: false,
      videoThumbnail: ""
    },
    {
      id: "ex-2",
      name: "Cat Camel Mobility",
      sets: 3,
      reps: 10,
      frequency: "Daily",
      safetyNotes: "Move slowly with controlled breathing.",
      completed: false,
      videoThumbnail: ""
    },
    {
      id: "ex-3",
      name: "Bridging",
      sets: 3,
      reps: 10,
      frequency: "5x per week",
      safetyNotes: "Keep pelvis neutral, avoid jerky movement.",
      completed: false,
      videoThumbnail: ""
    }
  ]
});

export const patientDashboardService = {
  getPatientIdentity,

  async getProfile() {
    const res = await api.get("/patient/me");
    return toObject(res);
  },

  async updateProfile(payload) {
    const res = await api.put("/patient/me", payload);
    return toObject(res);
  },

  async uploadProfilePhoto(formData) {
    const res = await api.post("/patient/me/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return toObject(res);
  },

  async getConsultants() {
    const first = await tryRequest(() => api.get("/consultant"), { allowStatuses: [404, 403] });
    if (first) return toArray(first);
    const fallback = await tryRequest(() => api.get("/consultants"), { allowStatuses: [404, 403] });
    return toArray(fallback);
  },

  async createAppointment(payload) {
    const first = await tryRequest(() => api.post("/appointment", payload), { allowStatuses: [404] });
    if (first) return toObject(first);
    const fallback = await tryRequest(() => api.post("/appointments", payload), { allowStatuses: [404] });
    return toObject(fallback);
  },

  async getSessions(patientRef = "") {
    const target = patientRef || getPatientIdentity().patientId || getPatientIdentity().mongoId;

    const patientEndpoint = await tryRequest(() => api.get("/patient/appointments"), { allowStatuses: [404, 403] });
    if (patientEndpoint) return toArray(patientEndpoint).map(normalizeSession);

    const myAppointments = await tryRequest(() => api.get("/appointments/my"), { allowStatuses: [404, 403] });
    if (myAppointments) return toArray(myAppointments).map(normalizeSession);

    const primary = target
      ? await tryRequest(() => api.get(`/appointments/patient/${encodeURIComponent(target)}`), { allowStatuses: [404, 403] })
      : null;
    if (primary) return toArray(primary).map(normalizeSession);

    const secondary = target
      ? await tryRequest(() => api.get(`/appointment?patientId=${encodeURIComponent(target)}`), { allowStatuses: [404, 403, 400] })
      : null;
    if (secondary) return toArray(secondary).map(normalizeSession);

    const generic = await tryRequest(() => api.get("/appointment"), { allowStatuses: [404, 403] });
    return toArray(generic).map(normalizeSession);
  },

  async getVitalsHistory(patientRef = "") {
    const target = patientRef || getPatientIdentity().patientId || getPatientIdentity().mongoId;
    const endpoint = target
      ? `/nurse/vitals?patientId=${encodeURIComponent(target)}`
      : "/nurse/vitals";
    const res = await tryRequest(() => api.get(endpoint), { allowStatuses: [404] });
    if (res) return toArray(res);
    const fallback = target
      ? await tryRequest(() => api.get(`/nurse/vitals/${encodeURIComponent(target)}`), { allowStatuses: [404] })
      : null;
    return toArray(fallback);
  },

  async getMedicalRecords(patientRef = "") {
    const target = patientRef || getPatientIdentity().patientId || getPatientIdentity().mongoId;
    const first = target
      ? await tryRequest(() => api.get(`/medicalRecords?patientId=${encodeURIComponent(target)}`), { allowStatuses: [404, 403] })
      : null;
    if (first) return toArray(first);

    const second = target
      ? await tryRequest(() => api.get(`/medical-records/patient/${encodeURIComponent(target)}`), { allowStatuses: [404, 403] })
      : null;
    return toArray(second);
  },

  async uploadMedicalRecord(formData) {
    const first = await tryRequest(
      () =>
        api.post("/medicalRecords/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        }),
      { allowStatuses: [404] }
    );
    if (first) return toObject(first);

    const second = await tryRequest(
      () =>
        api.post("/medical-records/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        }),
      { allowStatuses: [404] }
    );
    return toObject(second);
  },

  async deleteMedicalRecord(recordId) {
    const first = await tryRequest(() => api.delete(`/medicalRecords/${recordId}`), { allowStatuses: [404] });
    if (first) return true;
    const second = await tryRequest(() => api.delete(`/medical-records/${recordId}`), { allowStatuses: [404] });
    return Boolean(second);
  },

  async submitPainAssessment(payload) {
    const patientRef = payload?.patientId || getPatientIdentity().patientId || getPatientIdentity().mongoId || "self";
    const painRegion = payload?.region || payload?.bodyArea || "Pain_Abdomen";
    const intensity = Number(payload?.intensity || payload?.painIntensity || payload?.painScore || 0);
    const painType = payload?.painType || "Dull";
    const duration = payload?.duration || "1-3 Days";

    const newPainApi = await tryRequest(
      () =>
        api.post("/pain", {
          patientId: patientRef,
          region: painRegion,
          intensity: intensity || 1,
          painType,
          duration,
          notes: payload?.notes || ""
        }),
      { allowStatuses: [404, 403] }
    );
    if (newPainApi) return toObject(newPainApi);

    const first = await tryRequest(() => api.post("/painAssessment", payload), { allowStatuses: [404, 403] });
    if (first) return toObject(first);

    const second = await tryRequest(() => api.post("/painAssessments", payload), { allowStatuses: [404, 403] });
    if (second) return toObject(second);

    const list = readLocal("painAssessments", patientRef, []);
    const newRow = {
      _id: `PA-${Date.now()}`,
      patientId: patientRef,
      painIntensity: Number(payload?.painIntensity || 0),
      painType: payload?.painType || "OTHER",
      bodyArea: payload?.bodyArea || "General",
      notes: payload?.notes || "",
      createdAt: new Date().toISOString()
    };
    const merged = [newRow, ...list].slice(0, 100);
    writeLocal("painAssessments", patientRef, merged);
    return newRow;
  },

  async getPainAssessments(patientRef = "") {
    const target = patientRef || getPatientIdentity().patientId || getPatientIdentity().mongoId || "self";
    const newPainApi = await tryRequest(
      () => api.get(`/pain/${encodeURIComponent(target)}`),
      { allowStatuses: [404, 403] }
    );
    if (newPainApi) return toArray(newPainApi);

    const first = await tryRequest(
      () => api.get(`/painAssessment?patientId=${encodeURIComponent(target)}`),
      { allowStatuses: [404, 403] }
    );
    if (first) return toArray(first);

    const second = await tryRequest(
      () => api.get(`/painAssessments?patientId=${encodeURIComponent(target)}`),
      { allowStatuses: [404, 403] }
    );
    if (second) return toArray(second);

    return readLocal("painAssessments", target, []);
  },

  async getPosturalAssessments(patientRef = "") {
    const target = patientRef || getPatientIdentity().patientId || getPatientIdentity().mongoId || "self";
    const first = await tryRequest(
      () => api.get(`/posturalAssessment/${encodeURIComponent(target)}`),
      { allowStatuses: [404, 403] }
    );
    if (first) return toArray(first);

    const second = await tryRequest(
      () => api.get(`/postural-assessment/${encodeURIComponent(target)}`),
      { allowStatuses: [404, 403] }
    );
    if (second) return toArray(second);

    return readLocal("posturalAssessments", target, []);
  },

  async getTreatmentPlan(patientRef = "") {
    const target = patientRef || getPatientIdentity().patientId || getPatientIdentity().mongoId || "self";
    const first = await tryRequest(
      () => api.get(`/treatmentPlan/${encodeURIComponent(target)}`),
      { allowStatuses: [404, 403] }
    );
    if (first) {
      const data = toObject(first);
      if (Array.isArray(data)) return data[0] || defaultTreatmentPlan(target);
      return data;
    }

    const second = await tryRequest(
      () => api.get(`/treatment-plan/${encodeURIComponent(target)}`),
      { allowStatuses: [404, 403] }
    );
    if (second) {
      const data = toObject(second);
      if (Array.isArray(data)) return data[0] || defaultTreatmentPlan(target);
      return data;
    }

    const cached = readLocal("treatmentPlan", target, null);
    if (cached) return cached;
    const seeded = defaultTreatmentPlan(target);
    writeLocal("treatmentPlan", target, seeded);
    return seeded;
  },

  async markExerciseComplete(payload) {
    const patientRef = payload?.patientId || getPatientIdentity().patientId || getPatientIdentity().mongoId || "self";

    const first = await tryRequest(() => api.patch("/exercise/complete", payload), { allowStatuses: [404, 403] });
    if (first) return toObject(first);

    const second = await tryRequest(() => api.patch("/exercises/complete", payload), { allowStatuses: [404, 403] });
    if (second) return toObject(second);

    const plan = readLocal("treatmentPlan", patientRef, defaultTreatmentPlan(patientRef));
    const exerciseId = payload?.exerciseId;
    const exercises = Array.isArray(plan.exercises)
      ? plan.exercises.map((row) =>
          String(row.id || row._id) === String(exerciseId) ? { ...row, completed: true } : row
        )
      : [];
    const updated = { ...plan, exercises };
    writeLocal("treatmentPlan", patientRef, updated);
    return updated;
  },

  async getNotifications(patientRef = "") {
    const target = patientRef || getPatientIdentity().patientId || getPatientIdentity().mongoId || "self";
    const first = await tryRequest(
      () => api.get(`/notification?patientId=${encodeURIComponent(target)}`),
      { allowStatuses: [404, 403] }
    );
    if (first) return toArray(first);

    const second = await tryRequest(
      () => api.get(`/notifications?patientId=${encodeURIComponent(target)}`),
      { allowStatuses: [404, 403] }
    );
    if (second) return toArray(second);

    const existing = readLocal("notifications", target, []);
    if (existing.length) return existing;

    const sessions = await this.getSessions(target);
    const seeded = sessions.slice(0, 8).map((row, idx) => ({
      _id: `N-${idx}-${row.id || Date.now()}`,
      type: row?.sessionStatus === "CONFIRMED" ? "Appointment Confirmed" : "Session Reminder",
      message: `${row?.sessionStatus || "PENDING"} session on ${
        row?.sessionDate ? row.sessionDate.toLocaleDateString("en-IN") : "upcoming date"
      } at ${row?.timeSlot || "TBD"}.`,
      createdAt: row?.createdAt || new Date().toISOString(),
      isRead: false
    }));
    writeLocal("notifications", target, seeded);
    return seeded;
  },

  markNotificationRead(notificationId, patientRef = "") {
    const target = patientRef || getPatientIdentity().patientId || getPatientIdentity().mongoId || "self";
    const rows = readLocal("notifications", target, []);
    const next = rows.map((item) =>
      String(item._id || item.id) === String(notificationId) ? { ...item, isRead: true } : item
    );
    writeLocal("notifications", target, next);
    return next;
  },

  deleteNotification(notificationId, patientRef = "") {
    const target = patientRef || getPatientIdentity().patientId || getPatientIdentity().mongoId || "self";
    const rows = readLocal("notifications", target, []);
    const next = rows.filter((item) => String(item._id || item.id) !== String(notificationId));
    writeLocal("notifications", target, next);
    return next;
  }
};

export default patientDashboardService;
