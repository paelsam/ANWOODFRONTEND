import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { del, get, patch, post } from "@/services/client";
import { configurationAPI } from "@/services/configuration";

describe("services/configuration", () => {
  it("expone CRUD de configuración", () => {
    const payload = { clave: "iva", valor: "19" };

    configurationAPI.list();
    configurationAPI.get(5);
    configurationAPI.create(payload);
    configurationAPI.update(5, payload);
    configurationAPI.remove(5);

    expect(get).toHaveBeenNthCalledWith(1, "/configuracion/");
    expect(get).toHaveBeenNthCalledWith(2, "/configuracion/5");
    expect(post).toHaveBeenCalledWith("/configuracion/", payload);
    expect(patch).toHaveBeenCalledWith("/configuracion/5", payload);
    expect(del).toHaveBeenCalledWith("/configuracion/5");
  });
});
