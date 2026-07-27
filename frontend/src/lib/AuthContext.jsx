import React, { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "./api/auth.js";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  accessToken: "sentinelx_access_token",
  refreshToken: "sentinelx_refresh_token",
  user: "sentinelx_user",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(STORAGE_KEYS.accessToken));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // On first load, if we have a token, validate the session against /auth/me.
    async function bootstrap() {
      const token = localStorage.getItem(STORAGE_KEYS.accessToken);
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.getCurrentUser();
        setUser(me);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistSession({ access_token, refresh_token, user: u }) {
    localStorage.setItem(STORAGE_KEYS.accessToken, access_token);
    if (refresh_token) localStorage.setItem(STORAGE_KEYS.refreshToken, refresh_token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(u));
    setAccessToken(access_token);
    setUser(u);
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    setAccessToken(null);
    setUser(null);
  }

  async function login(email, password) {
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      persistSession(res);
      return { ok: true };
    } catch (e) {
      setError(e.message);
      return { ok: false, code: e.code, message: e.message };
    }
  }

  async function signup(fields) {
    setError(null);
    try {
      const res = await authApi.signup(fields);
      persistSession(res);
      return { ok: true };
    } catch (e) {
      setError(e.message);
      return { ok: false, code: e.code, message: e.message };
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }

  async function forgotPassword(email) {
    try {
      const res = await authApi.forgotPassword({ email });
      return { ok: true, message: res.message };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }

  async function resetPassword(token, newPassword) {
    try {
      const res = await authApi.resetPassword({ token, new_password: newPassword });
      return { ok: true, message: res.message };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    loading,
    error,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
