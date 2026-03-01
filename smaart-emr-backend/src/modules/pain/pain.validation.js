const validatePainCreatePayload = (req, res, next) => {
  try {
    const payload = req.body || {};
    const hasSingleEntry =
      payload.region || payload.bodyPart || payload.intensity !== undefined;

    if (!payload.patientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required",
        data: null
      });
    }

    if (!Array.isArray(payload.painEntries) && !hasSingleEntry) {
      return res.status(400).json({
        success: false,
        message: "painEntries is required",
        data: null
      });
    }

    if (Array.isArray(payload.painEntries) && payload.painEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "painEntries must contain at least one entry",
        data: null
      });
    }

    if (Array.isArray(payload.painEntries)) {
      for (const row of payload.painEntries) {
        const intensity = Number(row?.intensity);
        if (!row?.bodyPart || !row?.type || !row?.duration || Number.isNaN(intensity)) {
          return res.status(400).json({
            success: false,
            message: "Each pain entry needs bodyPart, intensity, type, and duration",
            data: null
          });
        }
        if (intensity < 1 || intensity > 10) {
          return res.status(400).json({
            success: false,
            message: "Pain intensity must be between 1 and 10",
            data: null
          });
        }
      }
    }

    return next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Invalid pain assessment payload",
      data: null
    });
  }
};

module.exports = {
  validatePainCreatePayload
};
