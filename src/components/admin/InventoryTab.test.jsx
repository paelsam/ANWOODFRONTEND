import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/inventory", () => ({
  inventoryAPI: {
    listPieces: vi.fn(),
    createPiece: vi.fn(),
    updatePiece: vi.fn(),
    deletePiece: vi.fn(),
  },
}));

import { inventoryAPI } from "@/services/inventory";
import InventoryTab from "@/components/admin/InventoryTab";
import { measureFixture, pieceFixture, woodTypeFixture } from "@/test/fixtures";

describe("InventoryTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inventoryAPI.listPieces.mockResolvedValue([pieceFixture]);
  });

  it("carga inventario y registra una nueva pieza", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();

    render(
      <InventoryTab
        notify={notify}
        woodTypes={[woodTypeFixture]}
        measures={[measureFixture]}
      />,
    );

    expect(await screen.findByText(`#${pieceFixture.id} · ${woodTypeFixture.nombre}`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nueva pieza/i }));

    const spinbuttons = screen.getAllByRole("spinbutton");
    await user.type(spinbuttons[0], "4");
    await user.type(spinbuttons[1], "10");
    await user.type(spinbuttons[2], "120000");
    await user.type(spinbuttons[3], "80000");
    await user.type(spinbuttons[4], "5");
    await user.click(screen.getByRole("button", { name: /Registrar pieza/i }));

    expect(inventoryAPI.createPiece).toHaveBeenCalledWith({
      tipo_madera_id: woodTypeFixture.id,
      medida_id: measureFixture.id,
      largo_m: 4,
      cantidad: 10,
      precio_unitario: 120000,
      costo_unitario: 80000,
      lote_id: 5,
    });
    expect(notify).toHaveBeenCalledWith("Pieza registrada");
  });

  it("edita e inactiva una pieza existente", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();

    render(
      <InventoryTab
        notify={notify}
        woodTypes={[woodTypeFixture]}
        measures={[measureFixture]}
      />,
    );

    expect(await screen.findByText(`#${pieceFixture.id} · ${woodTypeFixture.nombre}`)).toBeInTheDocument();

    await user.click(screen.getByTitle("Editar"));
    const largoInput = screen.getByDisplayValue(String(pieceFixture.largo_m));
    await user.clear(largoInput);
    await user.type(largoInput, "4.5");
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    expect(inventoryAPI.updatePiece).toHaveBeenCalledWith(pieceFixture.id, {
      estado: pieceFixture.estado,
      largo_m: 4.5,
      precio_unitario: pieceFixture.precio_unitario,
      costo_unitario: pieceFixture.costo_unitario,
    });

    await user.click(screen.getByTitle("Inactivar"));

    expect(inventoryAPI.deletePiece).toHaveBeenCalledWith(pieceFixture.id);
    expect(notify).toHaveBeenCalledWith("Pieza actualizada a inactiva", "info");
  });
});
