import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/clients", () => ({
  clientsAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/services/users", () => ({
  usersAPI: {
    list: vi.fn(),
  },
}));

import { clientsAPI } from "@/services/clients";
import { usersAPI } from "@/services/users";
import ClientsTab from "@/components/admin/ClientsTab";
import { clientFixture, userFixture } from "@/test/fixtures";

const inactiveClient = {
  ...clientFixture,
  id: 71,
  nombre_razon_social: "Cliente Inactivo",
  activo: false,
};

describe("ClientsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usersAPI.list.mockResolvedValue([userFixture]);
    clientsAPI.list.mockImplementation(async (activo) =>
      activo ? [clientFixture] : [inactiveClient],
    );
  });

  it("carga clientes y crea uno nuevo", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    const { container } = render(<ClientsTab notify={notify} />);

    expect(await screen.findByText(clientFixture.nombre_razon_social)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nuevo cliente/i }));

    const inputs = container.querySelectorAll("input");

    await user.type(inputs[0], "Cliente Nuevo SAS");
    await user.type(inputs[1], "901000999");
    await user.type(inputs[2], "nuevo@cliente.dev");
    await user.type(inputs[3], "3009998888");
    await user.type(inputs[4], "Calle 1");
    await user.click(screen.getByRole("button", { name: /Crear cliente/i }));

    expect(clientsAPI.create).toHaveBeenCalledWith({
      usuario_id: userFixture.id,
      tipo_cliente: "empresa",
      nombre_razon_social: "Cliente Nuevo SAS",
      identificacion_fiscal: "901000999",
      email: "nuevo@cliente.dev",
      telefono: "3009998888",
      direccion: "Calle 1",
      activo: true,
    });
    expect(notify).toHaveBeenCalledWith("Cliente creado");
  });

  it("edita, filtra e inactiva clientes", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    render(<ClientsTab notify={notify} />);

    expect(await screen.findByText(clientFixture.nombre_razon_social)).toBeInTheDocument();

    await user.selectOptions(screen.getAllByRole("combobox")[0], "all");
    expect(clientsAPI.list).toHaveBeenCalledWith(true);
    expect(clientsAPI.list).toHaveBeenCalledWith(false);

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    const nameInput = screen.getByDisplayValue(clientFixture.nombre_razon_social);
    await user.clear(nameInput);
    await user.type(nameInput, "Cliente Editado");
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    expect(clientsAPI.update).toHaveBeenCalledWith(clientFixture.id, {
      usuario_id: userFixture.id,
      tipo_cliente: clientFixture.tipo_cliente,
      nombre_razon_social: "Cliente Editado",
      identificacion_fiscal: clientFixture.identificacion_fiscal,
      email: clientFixture.email,
      telefono: clientFixture.telefono,
      direccion: clientFixture.direccion,
      activo: true,
    });

    await user.click(screen.getAllByRole("button", { name: "Inactivar" })[0]);

    expect(clientsAPI.remove).toHaveBeenCalledWith(clientFixture.id);
    expect(notify).toHaveBeenCalledWith("Cliente inactivado", "info");
  });
});
