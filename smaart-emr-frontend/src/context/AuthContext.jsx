import { createContext, useEffect, useMemo, useState } from "react";
import { AUTH_STORAGE_KEYS } from "../services/api";
import { loginUser, logoutUser } from "../services/auth.service";
import { normalizeRole } from "../utils/roleRedirect";

export const AuthContext = createContext(null);

const parseStoredUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
    if (!token) {
      localStorage.removeItem(AUTH_STORAGE_KEYS.user);
      setUser(null);
    } else {
      setUser(parseStoredUser());
    }
    setLoadingAuth(false);
  }, []);

  const login = async (payload) => {
    const res = await loginUser(payload);
    const data = res?.data?.data || {};
    const accessToken = data?.accessToken || data?.token || "";
    const refreshToken = data?.refreshToken || "";
    const role = normalizeRole(data?.user?.role || data?.role);
    const userId = data?.user?.id || data?.userId || null;

    if (data?.mustChangePassword && !accessToken) {
      return {
        success: true,
        mustChangePassword: true,
        user: {
          id: userId,
          role
        }
      };
    }

    const normalizedUser = {
      ...(data?.user || {}),
      id: data?.user?.id || userId,
      role,
      mustChangePassword: Boolean(data?.mustChangePassword || data?.user?.mustChangePassword)
    };

    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(normalizedUser));
    localStorage.removeItem(AUTH_STORAGE_KEYS.tokenExpired);

    setUser(normalizedUser);

    return {
      success: true,
      mustChangePassword: Boolean(data.mustChangePassword),
      user: normalizedUser
    };
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch {
        // local cleanup still required
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, setUser, login, logout, loadingAuth }),
    [user, loadingAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
