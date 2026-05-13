import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearToken, setToken } from "@/utils/token";
import { del, get, getBlob, patch, post, postForm } from "@/services/client";
import { createMockResponse } from "@/test/helpers/mockFetch";

describe("services/client", () => {
  beforeEach(() => {
    clearToken();
  });

  it("agrega Authorization si existe token", async () => {
    fetch.mockResolvedValue(createMockResponse({ jsonData: { ok: true } }));
    setToken("jwt-123");

    await get("/secure");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/secure"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-123",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("no agrega Authorization si no existe token", async () => {
    fetch.mockResolvedValue(createMockResponse({ jsonData: { ok: true } }));

    await get("/public");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/public"),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      }),
    );
  });

  it("usa application/json por defecto y respeta content-type explícito", async () => {
    fetch.mockResolvedValue(createMockResponse({ jsonData: { ok: true } }));

    await post("/items", { name: "Cedro" });
    await postForm("/token", { username: "u", password: "p" });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/items"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Cedro" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/token"),
      expect.objectContaining({
        method: "POST",
        body: "username=u&password=p",
        headers: expect.objectContaining({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      }),
    );
  });

  it("devuelve null ante 204", async () => {
    fetch.mockResolvedValue(createMockResponse({ status: 204 }));

    await expect(del("/items/1")).resolves.toBeNull();
  });

  it("lanza el detail string cuando la respuesta falla", async () => {
    fetch.mockResolvedValue(
      createMockResponse({
        ok: false,
        status: 400,
        jsonData: { detail: "Credenciales inválidas" },
      }),
    );

    await expect(get("/broken")).rejects.toThrow("Credenciales inválidas");
  });

  it("concatena mensajes cuando detail es array", async () => {
    fetch.mockResolvedValue(
      createMockResponse({
        ok: false,
        status: 422,
        jsonData: { detail: [{ msg: "faltante" }, { msg: "inválido" }] },
      }),
    );

    await expect(get("/broken")).rejects.toThrow("faltante, inválido");
  });

  it("usa Error status cuando no hay detail", async () => {
    fetch.mockResolvedValue(
      createMockResponse({
        ok: false,
        status: 500,
        jsonData: {},
      }),
    );

    await expect(get("/broken")).rejects.toThrow("Error 500");
  });

  it("serializa params y filtra null o undefined", async () => {
    fetch.mockResolvedValue(createMockResponse({ jsonData: [] }));

    await get("/pieces", {
      estado: "disponible",
      limit: 10,
      omitido: null,
      nada: undefined,
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/pieces?estado=disponible&limit=10"),
      expect.any(Object),
    );
  });

  it("envía patch y delete con los métodos correctos", async () => {
    fetch.mockResolvedValue(createMockResponse({ jsonData: { ok: true } }));

    await patch("/items/1", { cantidad: 4 });
    await del("/items/1");

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/items/1"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ cantidad: 4 }),
      }),
    );

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/items/1"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("getBlob devuelve blob cuando la respuesta es exitosa", async () => {
    const blob = new Blob(["cedro"]);
    fetch.mockResolvedValue({
      ok: true,
      blob: vi.fn(async () => blob),
    });

    await expect(getBlob("/files/1")).resolves.toBe(blob);
  });

  it("getBlob lanza error cuando fetch falla", async () => {
    fetch.mockResolvedValue({ ok: false, status: 404 });

    await expect(getBlob("/files/404")).rejects.toThrow("Error 404");
  });
});
