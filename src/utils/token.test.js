import { describe, expect, it } from "vitest";
import {
  clearStoredUser,
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "@/utils/token";

describe("token utils", () => {
  it("guarda y recupera el token", () => {
    setToken("abc123");

    expect(getToken()).toBe("abc123");

    clearToken();
    expect(getToken()).toBeNull();
  });

  it("guarda y recupera el usuario serializado", () => {
    const user = { username: "ana", role: "admin" };

    setStoredUser(user);

    expect(getStoredUser()).toEqual(user);
  });

  it("borra el usuario guardado", () => {
    setStoredUser({ username: "ana" });

    clearStoredUser();

    expect(getStoredUser()).toBeNull();
  });

  it("elimina la llave si setStoredUser recibe null", () => {
    setStoredUser({ username: "ana" });

    setStoredUser(null);

    expect(getStoredUser()).toBeNull();
  });

  it("devuelve null si el JSON almacenado está corrupto", () => {
    localStorage.setItem("angwood_user", "{broken");

    expect(getStoredUser()).toBeNull();
  });
});
