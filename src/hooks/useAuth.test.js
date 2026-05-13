import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/auth", () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

vi.mock("@/utils/token", () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getStoredUser: vi.fn(),
  setStoredUser: vi.fn(),
  clearStoredUser: vi.fn(),
}));

import { authAPI } from "@/services/auth";
import * as tokenUtils from "@/utils/token";
import { useAuth } from "@/hooks/useAuth";

function buildToken(payload) {
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenUtils.getStoredUser.mockReturnValue(null);
    tokenUtils.getToken.mockReturnValue(null);
  });

  it("termina la carga sin usuario cuando no hay token", async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.authLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("restaura la sesión cuando el JWT es válido", async () => {
    tokenUtils.getToken.mockReturnValue(
      buildToken({
        sub: "ana",
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    );
    tokenUtils.getStoredUser.mockReturnValue({ full_name: "Ana Pérez" });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.authLoading).toBe(false);
    });

    expect(result.current.user).toEqual({
      full_name: "Ana Pérez",
      username: "ana",
    });
  });

  it("limpia sesión si el token está vencido", async () => {
    tokenUtils.getToken.mockReturnValue(
      buildToken({
        sub: "ana",
        exp: Math.floor(Date.now() / 1000) - 10,
      }),
    );

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.authLoading).toBe(false);
    });

    expect(tokenUtils.clearToken).toHaveBeenCalled();
    expect(tokenUtils.clearStoredUser).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it("limpia sesión si el token es inválido", async () => {
    tokenUtils.getToken.mockReturnValue("broken.token");

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.authLoading).toBe(false);
    });

    expect(tokenUtils.clearToken).toHaveBeenCalled();
    expect(tokenUtils.clearStoredUser).toHaveBeenCalled();
  });

  it("login persiste token, usuario y notifica bienvenida", async () => {
    const notify = vi.fn();
    tokenUtils.getStoredUser.mockReturnValue({ full_name: "Ana Pérez" });
    authAPI.login.mockResolvedValue({
      access_token: buildToken({
        sub: "ana",
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    });

    const { result } = renderHook(() => useAuth({ notify }));

    await waitFor(() => {
      expect(result.current.authLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login("ana", "secreto");
    });

    expect(tokenUtils.setToken).toHaveBeenCalled();
    expect(tokenUtils.setStoredUser).toHaveBeenCalledWith({
      full_name: "Ana Pérez",
      username: "ana",
      role: "admin",
    });
    expect(result.current.user).toEqual({
      full_name: "Ana Pérez",
      username: "ana",
      role: "admin",
    });
    expect(notify).toHaveBeenCalledWith("Bienvenido, Ana Pérez");
  });

  it("logout limpia el estado y notifica", async () => {
    const notify = vi.fn();
    const { result } = renderHook(() => useAuth({ notify }));

    await waitFor(() => {
      expect(result.current.authLoading).toBe(false);
    });

    act(() => {
      result.current.logout();
    });

    expect(tokenUtils.clearToken).toHaveBeenCalled();
    expect(tokenUtils.clearStoredUser).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(notify).toHaveBeenCalledWith("Sesión cerrada", "info");
  });
});
