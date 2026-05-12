import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/configuration", () => ({
  configurationAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { configurationAPI } from "@/services/configuration";
import ConfigurationTab from "@/components/admin/ConfigurationTab";

const configurationFixture = {
  id: 1,
  clave: "iva",
  valor: "19",
  descripcion: "Impuesto",
  updated_at: "2026-05-01T00:00:00Z",
  updated_by_nombre: "Admin",
};

describe("ConfigurationTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configurationAPI.list.mockResolvedValue([configurationFixture]);
  });

  it("carga configuraciones y crea una nueva", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();

    render(<ConfigurationTab notify={notify} />);

    expect(await screen.findByText("iva")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Nueva configuración/i }),
    );

    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[0], "salvoconducto");
    await user.type(textboxes[1], "30000");
    await user.type(textboxes[2], "Tarifa EPA");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    expect(configurationAPI.create).toHaveBeenCalledWith({
      clave: "salvoconducto",
      valor: "30000",
      descripcion: "Tarifa EPA",
    });
    expect(notify).toHaveBeenCalledWith("Configuración creada");
  });

  it("edita y elimina una configuración", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    const { container } = render(<ConfigurationTab notify={notify} />);

    expect(await screen.findByText("iva")).toBeInTheDocument();

    const rowButtons = container.querySelectorAll("tbody button");
    await user.click(rowButtons[0]);

    const keyInput = screen.getByDisplayValue("iva");
    await user.clear(keyInput);
    await user.type(keyInput, "iva_general");
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    expect(configurationAPI.update).toHaveBeenCalledWith(1, {
      clave: "iva_general",
      valor: "19",
      descripcion: "Impuesto",
    });

    await user.click(container.querySelectorAll("tbody button")[1]);

    expect(configurationAPI.remove).toHaveBeenCalledWith(1);
    expect(notify).toHaveBeenCalledWith("Configuración eliminada");
  });

  it("muestra errores de validación al crear", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();

    render(<ConfigurationTab notify={notify} />);

    await screen.findByText("iva");
    await user.click(
      screen.getByRole("button", { name: /Nueva configuración/i }),
    );
    await user.click(screen.getByRole("button", { name: "Crear" }));

    expect(notify).toHaveBeenCalledWith("La clave es obligatoria", "error");
  });
});
