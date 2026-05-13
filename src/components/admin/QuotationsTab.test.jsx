import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/clients", () => ({
  clientsAPI: {
    list: vi.fn(),
  },
}));

vi.mock("@/services/quotations", () => ({
  quotationsAPI: {
    list: vi.fn(),
    setEstado: vi.fn(),
    remove: vi.fn(),
  },
}));

import { clientsAPI } from "@/services/clients";
import { quotationsAPI } from "@/services/quotations";
import QuotationsTab from "@/components/admin/QuotationsTab";
import { clientFixture, quotationFixture } from "@/test/fixtures";

describe("QuotationsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientsAPI.list.mockResolvedValue([clientFixture]);
    quotationsAPI.list.mockResolvedValue([quotationFixture]);
  });

  it("carga cotizaciones, filtra y permite aprobar desde el modal", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();

    render(<QuotationsTab notify={notify} />);

    expect(await screen.findByText(`#${quotationFixture.id}`)).toBeInTheDocument();

    await user.selectOptions(screen.getAllByRole("combobox")[0], "borrador");
    await user.selectOptions(
      screen.getAllByRole("combobox")[1],
      String(clientFixture.id),
    );

    expect(quotationsAPI.list).toHaveBeenCalledWith({
      limit: 100,
      estado: "borrador",
      cliente_id: String(clientFixture.id),
    });

    await user.click(screen.getByRole("button", { name: "Ver" }));
    expect(screen.getByText(`Cotización #${quotationFixture.id}`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aprobar" }));

    expect(quotationsAPI.setEstado).toHaveBeenCalledWith(
      quotationFixture.id,
      "aprobada",
    );
    expect(notify).toHaveBeenCalledWith(
      `Cotización #${quotationFixture.id} actualizada a aprobada`,
    );
  });

  it("permite cancelar una cotización", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();

    render(<QuotationsTab notify={notify} />);

    expect(await screen.findByText(`#${quotationFixture.id}`)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Cancelar" })[0]);

    expect(quotationsAPI.remove).toHaveBeenCalledWith(quotationFixture.id);
    expect(notify).toHaveBeenCalledWith("Cotización cancelada", "info");
  });
});
