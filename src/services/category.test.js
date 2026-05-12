import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { del, get, patch, post } from "@/services/client";
import { categoriesAPI } from "@/services/category";

describe("services/category", () => {
  it("expone CRUD de categorías", () => {
    const payload = { nombre: "Estructural" };

    categoriesAPI.list({ activo: true });
    categoriesAPI.get(3);
    categoriesAPI.create(payload);
    categoriesAPI.update(3, payload);
    categoriesAPI.remove(3);

    expect(get).toHaveBeenNthCalledWith(1, "/categorias/", { activo: true });
    expect(get).toHaveBeenNthCalledWith(2, "/categorias/3");
    expect(post).toHaveBeenCalledWith("/categorias/", payload);
    expect(patch).toHaveBeenCalledWith("/categorias/3", payload);
    expect(del).toHaveBeenCalledWith("/categorias/3");
  });
});
