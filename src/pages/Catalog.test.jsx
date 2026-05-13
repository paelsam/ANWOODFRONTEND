import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/inventory", () => ({
  inventoryAPI: {
    listWoodTypes: vi.fn(),
    listPieces: vi.fn(),
    listMeasures: vi.fn(),
  },
}));

import { inventoryAPI } from "@/services/inventory";
import Catalog from "@/pages/Catalog";
import {
  measureFixture,
  pieceFixture,
  woodTypeFixture,
} from "@/test/fixtures";
import { renderWithApp } from "@/test/helpers/renderWithApp";

describe("Catalog page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inventoryAPI.listWoodTypes.mockResolvedValue([woodTypeFixture]);
    inventoryAPI.listPieces.mockResolvedValue([pieceFixture]);
    inventoryAPI.listMeasures.mockResolvedValue([measureFixture]);
  });

  it("carga productos y permite agregarlos al carrito", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Catalog />);

    expect(await screen.findByText("Cedro")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Agregar/i }));

    expect(ctx.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: pieceFixture.id,
        woodName: "Cedro",
      }),
    );
  });

  it("permite filtrar, abrir detalles y navegar a cotización", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Catalog />);

    expect(await screen.findByText("Cedro")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Estructural" }));
    await user.type(
      screen.getByPlaceholderText("Buscar por tipo, medidas…"),
      "Cedro",
    );

    expect(screen.getByText("Cedro")).toBeInTheDocument();

    await user.click(screen.getByTitle("Detalles"));
    expect(screen.getByText("Propiedades de la Especie")).toBeInTheDocument();

    await user.click(screen.getByTitle("Cotizar"));
    expect(ctx.setPage).toHaveBeenCalledWith("quotation");
  });
});
