import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/clients", () => ({
  clientsAPI: {
    list: vi.fn(),
  },
}));

vi.mock("@/services/inventory", () => ({
  inventoryAPI: {
    listWoodTypes: vi.fn(),
    listMeasures: vi.fn(),
    listPieces: vi.fn(),
  },
}));

vi.mock("@/services/quotations", () => ({
  quotationsAPI: {
    preview: vi.fn(),
    create: vi.fn(),
  },
}));

import { clientsAPI } from "@/services/clients";
import { inventoryAPI } from "@/services/inventory";
import { quotationsAPI } from "@/services/quotations";
import Quotation from "@/pages/Quotation";
import {
  cartItemFixture,
  clientFixture,
  measureFixture,
  pieceFixture,
  quotationDetailFixture,
  staffUserFixture,
  userFixture,
  woodTypeFixture,
} from "@/test/fixtures";
import { renderWithApp } from "@/test/helpers/renderWithApp";

const previewFixture = {
  subtotal_piezas: 240000,
  metros_totales: 3.2,
  costo_cargue_terrestre: 0,
  costo_descargue_terrestre: 0,
  costo_cargue_maritimo: 0,
  costo_descargue_maritimo: 0,
  costo_salvoconducto_epa: 0,
  precio_epa_por_metro_usado: 0,
  total: 240000,
  porcentaje_anticipo: 100,
  monto_anticipo: 240000,
  detalles: [quotationDetailFixture],
};

describe("Quotation page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientsAPI.list.mockResolvedValue([clientFixture]);
    inventoryAPI.listWoodTypes.mockResolvedValue([woodTypeFixture]);
    inventoryAPI.listMeasures.mockResolvedValue([measureFixture]);
    inventoryAPI.listPieces.mockResolvedValue([pieceFixture]);
    quotationsAPI.preview.mockResolvedValue(previewFixture);
    quotationsAPI.create.mockResolvedValue({ id: 123 });
  });

  it("pide autenticación cuando no hay usuario", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Quotation />, { user: null, cart: [] });

    expect(screen.getByText("Inicia sesión para cotizar")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Ir a iniciar sesión/i }));
    expect(ctx.setPage).toHaveBeenCalledWith("login");
  });

  it("bloquea acceso cuando el usuario no puede cotizar", async () => {
    renderWithApp(<Quotation />, { user: userFixture, cart: [] });

    expect(await screen.findByText("No se pudo abrir cotizaciones")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tu usuario no tiene acceso al módulo de cotizaciones del backend actual.",
      ),
    ).toBeInTheDocument();
  });

  it("precarga desde el carrito, genera preview y guarda la cotización", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Quotation />, {
      user: staffUserFixture,
      cart: [cartItemFixture],
    });

    expect(await screen.findByText(/Nueva/)).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes(
          "Se tomaron 1 productos del carrito como base para esta cotización.",
        ),
      ).length,
    ).toBeGreaterThan(0);

    await waitFor(() => {
      expect(quotationsAPI.preview).toHaveBeenCalled();
    }, { timeout: 2000 });

    expect(screen.getByText("Resumen")).toBeInTheDocument();
    expect(screen.getByText("Guardar cotización")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Guardar cotización/i }));

    expect(quotationsAPI.create).toHaveBeenCalledWith({
      cliente_id: clientFixture.id,
      detalles: [
        {
          tipo_madera_id: cartItemFixture.tipo_madera_id,
          medida_id: cartItemFixture.medida_id,
          wood_piece_id: cartItemFixture.pieceId,
          largo_m: cartItemFixture.largo_m,
          cantidad: cartItemFixture.qty,
          notas: null,
        },
      ],
      porcentaje_anticipo: 100,
    });
    expect(ctx.notify).toHaveBeenCalledWith(
      "Cotización #123 creada correctamente",
      "success",
    );
    expect(ctx.setPage).toHaveBeenCalledWith("catalog");
  });
});
