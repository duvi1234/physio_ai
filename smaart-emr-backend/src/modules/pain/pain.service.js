const crypto = require("crypto");
const PainAssessment = require("./pain.model");
const { resolvePatient, canAccessPatientPain } = require("./pain.access");

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const normalizePainEntry = (entry = {}, index = 0) => {
  const bodyPart = String(entry.bodyPart || entry.region || "").trim();
  const intensity = Number(entry.intensity);
  const type = String(entry.type || entry.painType || "").trim();
  const duration = String(entry.duration || "").trim();

  if (!bodyPart || Number.isNaN(intensity) || !type || !duration) {
    const err = new Error("Each pain entry requires bodyPart, intensity, type and duration");
    err.status = 400;
    throw err;
  }
  if (intensity < 1 || intensity > 10) {
    const err = new Error("Pain intensity must be between 1 and 10");
    err.status = 400;
    throw err;
  }

  return {
    entryId:
      entry.entryId ||
      `PE-${Date.now()}-${index}-${crypto.randomBytes(3).toString("hex")}`,
    bodyPart,
    intensity,
    type,
    duration,
    notes: entry.notes ? String(entry.notes).trim() : "",
    createdAt: toDate(entry.createdAt) || new Date()
  };
};

const normalizePayloadEntries = (payload = {}) => {
  if (Array.isArray(payload.painEntries) && payload.painEntries.length) {
    return payload.painEntries.map((row, index) => normalizePainEntry(row, index));
  }

  // Backward-compatible single entry payload
  if (payload.region || payload.bodyPart || payload.intensity !== undefined) {
    return [normalizePainEntry(payload, 0)];
  }

  const err = new Error("painEntries is required");
  err.status = 400;
  throw err;
};

const buildFilters = (query = {}) => {
  const filters = {
    region: query.region ? String(query.region).trim() : "",
    minIntensity: Number(query.minIntensity),
    maxIntensity: Number(query.maxIntensity),
    fromDate: toDate(query.from),
    toDate: toDate(query.to)
  };
  if (Number.isNaN(filters.minIntensity)) filters.minIntensity = null;
  if (Number.isNaN(filters.maxIntensity)) filters.maxIntensity = null;
  return filters;
};

const applyEntryFilters = (entries, query = {}) => {
  const filters = buildFilters(query);
  return entries.filter((row) => {
    const rowRegion = row.region || row.bodyPart;
    if (filters.region && rowRegion !== filters.region) return false;
    if (filters.minIntensity !== null && Number(row.intensity) < filters.minIntensity) return false;
    if (filters.maxIntensity !== null && Number(row.intensity) > filters.maxIntensity) return false;
    const createdAt = toDate(row.createdAt);
    if (filters.fromDate && createdAt && createdAt < filters.fromDate) return false;
    if (filters.toDate && createdAt && createdAt > filters.toDate) return false;
    return true;
  });
};

const createClinicalSummary = (entries = []) => {
  if (!entries.length) return "";
  const mostSevere = entries.slice().sort((a, b) => Number(b.intensity) - Number(a.intensity))[0];
  const average = Number(
    (
      entries.reduce((sum, row) => sum + Number(row.intensity || 0), 0) / entries.length
    ).toFixed(1)
  );
  const severityBand =
    average >= 7 ? "severe" : average >= 4 ? "moderate" : "mild";

  return `Patient reports ${severityBand} pain, peak at ${mostSevere.bodyPart} (${mostSevere.intensity}/10), duration ${mostSevere.duration}.`;
};

const flattenSessions = (sessions = []) => {
  const rows = [];
  sessions.forEach((session) => {
    (session.painEntries || []).forEach((entry) => {
      rows.push({
        _id: entry.entryId,
        sessionId: session._id,
        patientId: session.patientId,
        region: entry.bodyPart,
        bodyPart: entry.bodyPart,
        intensity: entry.intensity,
        painType: entry.type,
        type: entry.type,
        duration: entry.duration,
        notes: entry.notes || "",
        createdAt: entry.createdAt || session.createdAt,
        recordedAt: entry.createdAt || session.createdAt,
        clinicalSummary: session.clinicalSummary || "",
        createdBy: session.createdBy
      });
    });
  });
  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const loadPatientWithAccess = async (patientRef, actorUser) => {
  const patient = await resolvePatient(patientRef);
  if (!patient) {
    const err = new Error("Patient not found");
    err.status = 404;
    throw err;
  }
  const allowed = await canAccessPatientPain(actorUser, patient);
  if (!allowed) {
    const err = new Error("Access denied for this patient");
    err.status = 403;
    throw err;
  }
  return patient;
};

exports.createPainEntry = async (payload = {}, actorUser, options = {}) => {
  const patientRef = payload.patientId || payload.patientRef;
  if (!patientRef) {
    const err = new Error("patientId is required");
    err.status = 400;
    throw err;
  }

  const patient = await loadPatientWithAccess(patientRef, actorUser);
  const normalizedEntries = normalizePayloadEntries(payload);
  const idempotencyKey = String(options.idempotencyKey || payload.idempotencyKey || "").trim() || null;

  if (idempotencyKey) {
    const existing = await PainAssessment.findOne({ idempotencyKey })
      .populate("createdBy", "name userId nurseId physioId role");
    if (existing) {
      return existing;
    }
  }

  const created = await PainAssessment.create({
    patientId: patient._id,
    painEntries: normalizedEntries,
    clinicalSummary: createClinicalSummary(normalizedEntries),
    assessmentDate: toDate(payload.assessmentDate) || new Date(),
    idempotencyKey,
    createdBy: actorUser?._id || null,
    createdByRole: String(actorUser?.role || "").toUpperCase()
  });
  return created;
};

exports.getPainEntries = async (patientRef, query = {}, actorUser) => {
  const patient = await loadPatientWithAccess(patientRef, actorUser);
  const sessions = await PainAssessment.find({ patientId: patient._id })
    .sort({ createdAt: -1 })
    .populate("createdBy", "name userId nurseId physioId role")
    .lean();

  const flattened = flattenSessions(sessions);
  return applyEntryFilters(flattened, query);
};

exports.getPainTimeline = async (patientRef, query = {}, actorUser) => {
  const entries = await exports.getPainEntries(patientRef, query, actorUser);

  const points = entries
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((row) => ({
      date: row.createdAt,
      region: row.region,
      intensity: Number(row.intensity || 0)
    }));

  const regionMap = {};
  points.forEach((row) => {
    if (!regionMap[row.region]) {
      regionMap[row.region] = { region: row.region, count: 0, totalIntensity: 0 };
    }
    regionMap[row.region].count += 1;
    regionMap[row.region].totalIntensity += row.intensity;
  });

  const regionSummary = Object.values(regionMap).map((row) => ({
    ...row,
    averageIntensity: row.count ? Number((row.totalIntensity / row.count).toFixed(2)) : 0
  }));

  return { points, regionSummary };
};

exports.getPainReport = async (patientRef, query = {}, actorUser) => {
  const patient = await loadPatientWithAccess(patientRef, actorUser);
  const entries = await exports.getPainEntries(patientRef, query, actorUser);
  const timeline = await exports.getPainTimeline(patientRef, query, actorUser);

  const totalEntries = entries.length;
  const averagePain = totalEntries
    ? Number(
        (
          entries.reduce((sum, row) => sum + Number(row.intensity || 0), 0) / totalEntries
        ).toFixed(2)
      )
    : 0;

  let mostAffectedRegion = "";
  let maxCount = 0;
  timeline.regionSummary.forEach((row) => {
    if (row.count > maxCount) {
      maxCount = row.count;
      mostAffectedRegion = row.region;
    }
  });

  const sorted = entries
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const trend =
    sorted.length > 1
      ? Number(sorted[sorted.length - 1].intensity) <= Number(sorted[0].intensity)
        ? "IMPROVING"
        : "WORSENING"
      : "STABLE";

  return {
    patient: {
      id: patient._id,
      patientId: patient.patientId,
      fullName: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
      phone: patient.phone || "",
      email: patient.email || "",
      gender: patient.gender || "",
      age: patient.age || ""
    },
    metrics: {
      totalEntries,
      averagePain,
      mostAffectedRegion,
      trend,
      summaryText: createClinicalSummary(entries)
    },
    timeline,
    entries
  };
};
