import { useCallback, useEffect, useState } from "react";
import { authAPI } from "@/services/auth";
import {
  clearStoredUser,
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "@/utils/token";

function parseJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isJwtExpired(payload) {
  if (!payload?.exp || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 <= Date.now();
}

export function useAuth({ notify } = {}) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const restore = () => {
      const token = getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      const payload = parseJwtPayload(token);
      if (!payload || isJwtExpired(payload)) {
        clearToken();
        clearStoredUser();
        setAuthLoading(false);
        return;
      }
      const username = payload.sub;
      const snapshot = getStoredUser() || {};
      setUser({
        ...snapshot,
        username: username || snapshot.username,
      });
      setAuthLoading(false);
    };
    restore();
  }, []);

  const login = useCallback(
    async (username, password) => {
      const data = await authAPI.login(username, password);
      setToken(data.access_token);
      const payload = parseJwtPayload(data.access_token);
      const sub = payload?.sub || username;
      const role = payload?.role || "user";
      const snapshot = getStoredUser() || {};
      const next = {
        ...snapshot,
        username: sub,
        role: role,
      };
      console.log("next", next);
      setStoredUser(next);
      setUser(next);
      const display = next.full_name || next.username || sub;
      notify?.("Bienvenido, " + display);
      return true;
    },
    [notify],
  );

  const logout = useCallback(() => {
    clearToken();
    clearStoredUser();
    setUser(null);
    notify?.("Sesión cerrada", "info");
  }, [notify]);

  return { user, setUser, authLoading, login, logout };
}
