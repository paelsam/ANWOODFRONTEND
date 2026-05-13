import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Header from "@/components/layout/Header";
import { renderWithApp } from "@/test/helpers/renderWithApp";

describe("Header", () => {
  it("muestra botón de admin solo para usuarios admin", () => {
    renderWithApp(<Header />, {
      user: { username: "ana", role: "admin" },
      cart: [],
    });

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("muestra login cuando no hay usuario", () => {
    renderWithApp(<Header />, { user: null, cart: [] });

    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
  });

  it("muestra el badge del carrito con máximo 99+", () => {
    renderWithApp(<Header />, {
      cart: [
        { id: 1, qty: 50 },
        { id: 2, cantidad: 60 },
      ],
    });

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("ejecuta logout al hacer click en cerrar sesión", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Header />, {
      user: { username: "ana", full_name: "Ana", role: "user" },
      cart: [],
    });

    await user.click(screen.getByLabelText("Cerrar sesión"));

    expect(ctx.logout).toHaveBeenCalled();
  });

  it("vuelve al catálogo al hacer click en el logo", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Header />, { cart: [] });

    await user.click(screen.getByRole("img", { name: "ANGWOOD" }).closest("button"));

    expect(ctx.setPage).toHaveBeenCalledWith("catalog");
  });
});
