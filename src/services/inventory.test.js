import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { del, get, patch, post } from "@/services/client";
import { inventoryAPI } from "@/services/inventory";

describe("services/inventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("wood types", () => {
    it("lista, consulta, crea, actualiza y elimina tipos de madera", () => {
      inventoryAPI.listWoodTypes({ activo: true });
      inventoryAPI.getWoodType(1);
      inventoryAPI.createWoodType({ nombre: "Cedro" });
      inventoryAPI.updateWoodType(1, { nombre: "Roble" });
      inventoryAPI.deleteWoodType(1);

      expect(get).toHaveBeenNthCalledWith(1, "/wood-types/", { activo: true });
      expect(get).toHaveBeenNthCalledWith(2, "/wood-types/1");
      expect(post).toHaveBeenCalledWith("/wood-types/", { nombre: "Cedro" });
      expect(patch).toHaveBeenCalledWith("/wood-types/1", { nombre: "Roble" });
      expect(del).toHaveBeenCalledWith("/wood-types/1");
    });
  });

  describe("pieces", () => {
    it("lista, consulta, crea, actualiza y elimina piezas", () => {
      inventoryAPI.listPieces({ limit: 10 });
      inventoryAPI.getPiece(2);
      inventoryAPI.createPiece({ largo_m: 3.2 });
      inventoryAPI.updatePiece(2, { estado: "reservado" });
      inventoryAPI.deletePiece(2);

      expect(get).toHaveBeenNthCalledWith(1, "/piezas", { limit: 10 });
      expect(get).toHaveBeenNthCalledWith(2, "/piezas/2");
      expect(post).toHaveBeenCalledWith("/piezas", { largo_m: 3.2 });
      expect(patch).toHaveBeenCalledWith("/piezas/2", { estado: "reservado" });
      expect(del).toHaveBeenCalledWith("/piezas/2");
    });
  });

  describe("categories", () => {
    it("lista, consulta, crea, actualiza y elimina categorías", () => {
      inventoryAPI.listCategories({ activo: true });
      inventoryAPI.getCategory(3);
      inventoryAPI.createCategory({ nombre: "Estructural" });
      inventoryAPI.updateCategory(3, { nombre: "Premium" });
      inventoryAPI.deleteCategory(3);

      expect(get).toHaveBeenNthCalledWith(1, "/categorias/", { activo: true });
      expect(get).toHaveBeenNthCalledWith(2, "/categorias/3");
      expect(post).toHaveBeenCalledWith("/categorias/", {
        nombre: "Estructural",
      });
      expect(patch).toHaveBeenCalledWith("/categorias/3", {
        nombre: "Premium",
      });
      expect(del).toHaveBeenCalledWith("/categorias/3");
    });
  });

  describe("measures", () => {
    it("lista, consulta, crea, actualiza y elimina medidas", () => {
      inventoryAPI.listMeasures({ activo: true });
      inventoryAPI.getMeasure(4);
      inventoryAPI.createMeasure({ etiqueta: '2" x 4"' });
      inventoryAPI.updateMeasure(4, { etiqueta: '2" x 6"' });
      inventoryAPI.deleteMeasure(4);

      expect(get).toHaveBeenNthCalledWith(1, "/medidas/", { activo: true });
      expect(get).toHaveBeenNthCalledWith(2, "/medidas/4");
      expect(post).toHaveBeenCalledWith("/medidas/", { etiqueta: '2" x 4"' });
      expect(patch).toHaveBeenCalledWith("/medidas/4", { etiqueta: '2" x 6"' });
      expect(del).toHaveBeenCalledWith("/medidas/4");
    });
  });
});
