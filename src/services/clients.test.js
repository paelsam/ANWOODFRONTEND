import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { del, get, patch, post } from "@/services/client";
import { clientsAPI } from "@/services/clients";

describe("services/clients", () => {
  it("list filtra por activo cuando se envía el parámetro", () => {
    clientsAPI.list(true);
    clientsAPI.list(false);
    clientsAPI.list();

    expect(get).toHaveBeenNthCalledWith(1, "/clientes", { activo: true });
    expect(get).toHaveBeenNthCalledWith(2, "/clientes", { activo: false });
    expect(get).toHaveBeenNthCalledWith(3, "/clientes", undefined);
  });

  it("get/create/update/remove delegan al cliente HTTP", () => {
    const payload = { nombre_razon_social: "Cliente Test" };

    clientsAPI.get(7);
    clientsAPI.create(payload);
    clientsAPI.update(7, payload);
    clientsAPI.remove(7);

    expect(get).toHaveBeenCalledWith("/clientes/7");
    expect(post).toHaveBeenCalledWith("/clientes", payload);
    expect(patch).toHaveBeenCalledWith("/clientes/7", payload);
    expect(del).toHaveBeenCalledWith("/clientes/7");
  });
});
