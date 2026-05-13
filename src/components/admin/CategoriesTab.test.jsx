import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/category", () => ({
  categoriesAPI: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { categoriesAPI } from "@/services/category";
import CategoriesTab from "@/components/admin/CategoriesTab";
import { categoryFixture } from "@/test/fixtures";

describe("CategoriesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea una categoría y refresca catálogos", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    const reloadWoodData = vi.fn();

    render(
      <CategoriesTab
        notify={notify}
        categories={[categoryFixture]}
        reloadWoodData={reloadWoodData}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Nueva categoria/i }));

    const textboxes = screen.getAllByRole("textbox");
    const spinbuttons = screen.getAllByRole("spinbutton");

    await user.type(textboxes[0], "Premium");
    await user.type(textboxes[1], "precio_por_metro");
    await user.type(spinbuttons[0], "1000");
    await user.type(spinbuttons[1], "2000");
    await user.click(screen.getByRole("button", { name: /Crear categoria/i }));

    expect(categoriesAPI.create).toHaveBeenCalledWith({
      nombre: "Premium",
      estrategia_precio: "precio_por_metro",
      permite_cubicacion: false,
      min_precio_m3: 1000,
      max_precio_m3: 2000,
    });
    expect(notify).toHaveBeenCalledWith("Categoria creada");
    expect(reloadWoodData).toHaveBeenCalled();
  });

  it("edita y elimina una categoría existente", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    const reloadWoodData = vi.fn();

    render(
      <CategoriesTab
        notify={notify}
        categories={[categoryFixture]}
        reloadWoodData={reloadWoodData}
      />,
    );

    await user.click(screen.getByTitle("Editar"));
    const nameInput = screen.getByDisplayValue(categoryFixture.nombre);
    await user.clear(nameInput);
    await user.type(nameInput, "Estructural Plus");
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    expect(categoriesAPI.update).toHaveBeenCalledWith(categoryFixture.id, {
      nombre: "Estructural Plus",
      estrategia_precio: categoryFixture.estrategia_precio,
      permite_cubicacion: true,
      min_precio_m3: categoryFixture.min_precio_m3,
      max_precio_m3: categoryFixture.max_precio_m3,
    });

    await user.click(screen.getByTitle("Eliminar"));

    expect(categoriesAPI.remove).toHaveBeenCalledWith(categoryFixture.id);
    expect(notify).toHaveBeenCalledWith("Categoria eliminada", "info");
  });

  it("muestra errores de validación", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();

    render(
      <CategoriesTab
        notify={notify}
        categories={[categoryFixture]}
        reloadWoodData={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Nueva categoria/i }));
    await user.click(screen.getByRole("button", { name: /Crear categoria/i }));

    expect(notify).toHaveBeenCalledWith(
      "Completa nombre, estrategia y precio minimo.",
      "error",
    );
  });
});
