import api from "./api";

export const loginUser = (payload) => api.post("/auth/login", payload);
export const refreshToken = (refreshTokenValue) => api.post("/auth/refresh", { refreshToken: refreshTokenValue });
export const logoutUser = (refreshTokenValue) => api.post("/auth/logout", { refreshToken: refreshTokenValue });

export const changePassword = (data) => api.patch("/auth/change-password", data);
export const forgotPassword = (identifier) => api.post("/auth/forgot-password", { identifier });
export const resetPassword = (token, newPassword) => api.post("/auth/reset-password", { token, newPassword });

export const registerAdmin = (data) => api.post("/auth/register-admin", data);

export const checkAdminExists = async () => {
  try {
    return await api.get("/auth/check-admin-exists");
  } catch (error) {
    if (error?.response?.status === 404) {
      return {
        data: {
          success: true,
          data: {
            exists: true,
            fallback: true
          }
        }
      };
    }
    throw error;
  }
};

export const registerPatient = (payload) =>
  api.post("/auth/register-patient", payload).catch(() => api.post("/patient/register", payload));
