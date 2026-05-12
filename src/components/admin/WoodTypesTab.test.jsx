import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/inventory", () => ({
  inventoryAPI: {
    createWoodType: vi.fn(),
    updateWoodType: vi.fn(),
    deleteWoodType: vi.fn(),
  },
}));

vi.mock("@/services/uploads", () => ({
  uploadWoodTypeImage: vi.fn(),
}));

import { inventoryAPI } from "@/services/inventory";
import WoodTypesTab from "@/components/admin/WoodTypesTab";
import { categoryFixture, woodTypeFixture } from "@/test/fixtures";

describe("WoodTypesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea un tipo de madera", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    const reloadWoodData = vi.fn();

    render(
      <WoodTypesTab
        notify={notify}
        woodTypes={[woodTypeFixture]}
        categories={[categoryFixture]}
        reloadWoodData={reloadWoodData}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Nuevo tipo/i }));

    const textboxes = screen.getAllByRole("textbox");
    const spinbuttons = screen.getAllByRole("spinbutton");

    await user.type(textboxes[0], "Roble");
    await user.type(textboxes[1], "Madera fuerte");
    await user.type(spinbuttons[0], "700");
    await user.type(spinbuttons[1], "90000");
    await user.click(screen.getByRole("button", { name: /Crear tipo/i }));

    expect(inventoryAPI.createWoodType).toHaveBeenCalledWith({
      nombre: "Roble",
      categoria_id: categoryFixture.id,
      densidad_kg_m3: 700,
      precio_por_metro: 90000,
      descripcion: "Madera fuerte",
      activo: true,
      imagenes: [],
    });
    expect(notify).toHaveBeenCalledWith("Tipo de madera registrado");
    expect(reloadWoodData).toHaveBeenCalled();
  });

  it("edita y elimina un tipo de madera", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    const reloadWoodData = vi.fn();

    render(
      <WoodTypesTab
        notify={notify}
        woodTypes={[woodTypeFixture]}
        categories={[categoryFixture]}
        reloadWoodData={reloadWoodData}
      />,
    );

    await user.click(screen.getByTitle("Editar"));
    const nameInput = screen.getByDisplayValue(woodTypeFixture.nombre);
    await user.clear(nameInput);
    await user.type(nameInput, "Cedro Rojo");
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    expect(inventoryAPI.updateWoodType).toHaveBeenCalledWith(woodTypeFixture.id, {
      nombre: "Cedro Rojo",
      categoria_id: categoryFixture.id,
      densidad_kg_m3: woodTypeFixture.densidad_kg_m3,
      precio_por_metro: woodTypeFixture.precio_por_metro,
      descripcion: woodTypeFixture.descripcion,
      activo: true,
      imagenes: woodTypeFixture.imagenes,
    });

    await user.click(screen.getByTitle("Eliminar"));

    expect(inventoryAPI.deleteWoodType).toHaveBeenCalledWith(woodTypeFixture.id);
    expect(notify).toHaveBeenCalledWith("Tipo de madera eliminado", "info");
  });
});
