import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AUTH_STORAGE_KEYS = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  user: "user",
  tokenExpired: "tokenExpired"
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.user);
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (status === 401 && !originalRequest?._retry) {
      const refresh = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
      if (refresh) {
        try {
          originalRequest._retry = true;
          const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: refresh });
          const newAccessToken = refreshRes?.data?.data?.accessToken;
          const newRefreshToken = refreshRes?.data?.data?.refreshToken;

          if (newAccessToken) {
            localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, newRefreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch {
          // fallback to clear-auth flow below
        }
      }
    }

    if (status === 401) {
      const path = window.location.pathname;
      if (!path.includes("/staff/login") && !path.includes("/patient/login")) {
        localStorage.setItem(AUTH_STORAGE_KEYS.tokenExpired, "1");
      }
      clearAuthStorage();
    }

    return Promise.reject(error);
  }
);

export default api;
