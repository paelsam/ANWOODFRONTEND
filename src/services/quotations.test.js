import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { del, get, patch, post } from "@/services/client";
import { quotationsAPI } from "@/services/quotations";

describe("services/quotations", () => {
  it("lista y consulta cotizaciones", () => {
    quotationsAPI.list({ estado: "borrador" });
    quotationsAPI.get(9);

    expect(get).toHaveBeenNthCalledWith(1, "/cotizaciones", {
      estado: "borrador",
    });
    expect(get).toHaveBeenNthCalledWith(2, "/cotizaciones/9");
  });

  it("preview, create y addDetalle usan post", () => {
    quotationsAPI.preview({ detalles: [] });
    quotationsAPI.create({ cliente_id: 7 });
    quotationsAPI.addDetalle(9, { cantidad: 1 });

    expect(post).toHaveBeenNthCalledWith(1, "/cotizaciones/preview", {
      detalles: [],
    });
    expect(post).toHaveBeenNthCalledWith(2, "/cotizaciones", { cliente_id: 7 });
    expect(post).toHaveBeenNthCalledWith(3, "/cotizaciones/9/detalles", {
      cantidad: 1,
    });
  });

  it("update y setEstado usan patch", () => {
    quotationsAPI.update(9, { notas: "ok" });
    quotationsAPI.setEstado(9, "aprobada");

    expect(patch).toHaveBeenNthCalledWith(1, "/cotizaciones/9", {
      notas: "ok",
    });
    expect(patch).toHaveBeenNthCalledWith(2, "/cotizaciones/9/estado", {
      estado: "aprobada",
    });
  });

  it("removeDetalle y remove usan delete", () => {
    quotationsAPI.removeDetalle(9, 33);
    quotationsAPI.remove(9);

    expect(del).toHaveBeenNthCalledWith(1, "/cotizaciones/9/detalles/33");
    expect(del).toHaveBeenNthCalledWith(2, "/cotizaciones/9");
  });
});
