import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/users", () => ({
  usersAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { usersAPI } from "@/services/users";
import UsersTab from "@/components/admin/UsersTab";
import { adminUserFixture, userFixture } from "@/test/fixtures";

describe("UsersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usersAPI.list.mockResolvedValue([adminUserFixture, userFixture]);
  });

  it("carga usuarios y crea uno nuevo", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    const { container } = render(<UsersTab notify={notify} />);

    expect(await screen.findByText(adminUserFixture.username)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nuevo usuario/i }));

    const inputs = container.querySelectorAll("input");
    const selects = container.querySelectorAll("select");

    await user.type(inputs[0], "nuevo");
    await user.type(inputs[1], "Usuario Nuevo");
    await user.type(inputs[2], "nuevo@test.dev");
    await user.type(inputs[3], "3001234567");
    await user.type(inputs[4], "secret123");
    await user.selectOptions(selects[0], "3");
    await user.click(screen.getByRole("button", { name: /Crear usuario/i }));

    expect(usersAPI.create).toHaveBeenCalledWith({
      username: "nuevo",
      full_name: "Usuario Nuevo",
      email: "nuevo@test.dev",
      phone: "3001234567",
      role_id: 3,
      password: "secret123",
    });
    expect(notify).toHaveBeenCalledWith("Usuario registrado");
  });

  it("actualiza e inactiva usuarios", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    render(<UsersTab notify={notify} />);

    expect(await screen.findByText(adminUserFixture.username)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    const usernameInput = screen.getByDisplayValue(adminUserFixture.username);
    await user.clear(usernameInput);
    await user.type(usernameInput, "admin-master");
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    expect(usersAPI.update).toHaveBeenCalledWith(adminUserFixture.id, {
      username: "admin-master",
      full_name: adminUserFixture.full_name,
      email: adminUserFixture.email,
      phone: adminUserFixture.phone,
      role_id: adminUserFixture.role_id,
      disabled: false,
    });

    await user.click(screen.getAllByRole("button", { name: "Inactivar" })[0]);

    expect(usersAPI.remove).toHaveBeenCalledWith(adminUserFixture.id);
    expect(notify).toHaveBeenCalledWith("Usuario inactivado");
  });
});
