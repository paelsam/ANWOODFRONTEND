import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/auth", () => ({
  authAPI: {
    register: vi.fn(),
  },
}));

vi.mock("@/utils/token", () => ({
  setStoredUser: vi.fn(),
}));

import { authAPI } from "@/services/auth";
import { setStoredUser } from "@/utils/token";
import Login from "@/pages/Login";
import { renderWithApp } from "@/test/helpers/renderWithApp";

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite alternar a registro y valida campos obligatorios", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Login />);

    await user.click(screen.getByRole("button", { name: "Regístrate" }));
    expect(screen.getByText("Crea tu cuenta para continuar")).toBeInTheDocument();

    const createButton = screen.getByRole("button", { name: "Crear cuenta" });
    expect(createButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("nombre_usuario"), "ana");
    await user.type(screen.getByPlaceholderText("••••••••"), "secret123");
    expect(createButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("correo@ejemplo.com"), "ana@test.dev");
    expect(createButton).toBeEnabled();

    await user.clear(screen.getByPlaceholderText("correo@ejemplo.com"));
    await user.click(createButton);

    expect(ctx.notify).not.toHaveBeenCalled();
  });

  it("inicia sesión y navega al catálogo también con Enter", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(true);
    const { ctx } = renderWithApp(<Login />, { login });

    await user.type(screen.getByPlaceholderText("nombre_usuario"), "ana");
    await user.type(screen.getByPlaceholderText("••••••••"), "secret123{Enter}");

    expect(login).toHaveBeenCalledWith("ana", "secret123");
    expect(ctx.setPage).toHaveBeenCalledWith("catalog");
  });

  it("muestra error si login falla", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error("Credenciales inválidas"));

    renderWithApp(<Login />, { login });

    await user.type(screen.getByPlaceholderText("nombre_usuario"), "ana");
    await user.type(screen.getByPlaceholderText("••••••••"), "mal");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("Credenciales inválidas")).toBeInTheDocument();
  });

  it("registra una cuenta, guarda snapshot y vuelve a login", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Login />);

    await user.click(screen.getByRole("button", { name: "Regístrate" }));
    await user.type(screen.getByPlaceholderText("Tu nombre"), "Ana Pérez");
    await user.type(screen.getByPlaceholderText("nombre_usuario"), "ana");
    await user.type(screen.getByPlaceholderText("correo@ejemplo.com"), "ana@test.dev");
    await user.type(screen.getByPlaceholderText("3152589872"), "3001234567");
    await user.type(screen.getByPlaceholderText("••••••••"), "secret123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(authAPI.register).toHaveBeenCalledWith({
      username: "ana",
      email: "ana@test.dev",
      phone: "3001234567",
      full_name: "Ana Pérez",
      password: "secret123",
    });
    expect(setStoredUser).toHaveBeenCalled();
    expect(ctx.notify).toHaveBeenCalledWith("¡Cuenta creada! Inicia sesión ahora.");
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument();
  });
});
