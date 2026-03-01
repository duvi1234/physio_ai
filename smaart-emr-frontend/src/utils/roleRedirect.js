export const roleRedirect = (role) => {
  const normalized = String(role || "").toUpperCase();

  if (["ADMIN", "SUPER_ADMIN"].includes(normalized)) return "/admin/dashboard";
  if (normalized === "NURSE") return "/dashboard/nurse";
  if (["CONSULTANT", "PHYSIO", "PHYSIOTHERAPIST"].includes(normalized)) return "/dashboard/physio";
  if (normalized === "PATIENT") return "/dashboard/patient";

  return "/staff/login";
};

export const normalizeRole = (role) => {
  const normalized = String(role || "").toUpperCase();
  if (["PHYSIO", "PHYSIOTHERAPIST"].includes(normalized)) return "CONSULTANT";
  if (normalized === "SUPER_ADMIN") return "ADMIN";
  return normalized;
};
