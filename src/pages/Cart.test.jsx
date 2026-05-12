import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Cart from "@/pages/Cart";
import { cartItemFixture, userFixture } from "@/test/fixtures";
import { renderWithApp } from "@/test/helpers/renderWithApp";

describe("Cart page", () => {
  it("muestra estado vacío y permite volver al catálogo", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Cart />, {
      cart: [],
      getCartTotal: () => 0,
      getCartItemCount: () => 0,
    });

    expect(screen.getByText("Carrito vacío")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Explorar Catálogo/i }));
    expect(ctx.setPage).toHaveBeenCalledWith("catalog");
  });

  it("permite ajustar cantidades, vaciar, cotizar y eliminar", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Cart />, {
      user: userFixture,
      cart: [cartItemFixture],
      getCartTotal: () => 240000,
      getCartItemCount: () => 2,
    });

    expect(
      screen.getByRole("heading", { name: /Tu\s+Carrito/i }),
    ).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    await user.click(buttons.find((button) => button.textContent === "+"));
    expect(ctx.updateCartQty).toHaveBeenCalledWith(cartItemFixture.id, 3);

    await user.click(screen.getByTitle("Eliminar"));
    expect(ctx.removeFromCart).toHaveBeenCalledWith(cartItemFixture.id);

    await user.click(screen.getByRole("button", { name: /Vaciar todo/i }));
    expect(ctx.clearCart).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Generar Cotización/i }));
    expect(ctx.setPage).toHaveBeenCalledWith("quotation");
    expect(ctx.notify).toHaveBeenCalledWith(
      "Usaremos los productos del carrito como base de la cotización",
      "success",
    );
  });

  it("redirige al login al pagar como invitado", async () => {
    const user = userEvent.setup();
    const { ctx } = renderWithApp(<Cart />, {
      user: null,
      cart: [cartItemFixture],
      getCartTotal: () => 240000,
      getCartItemCount: () => 2,
    });

    await user.click(screen.getByRole("button", { name: /Proceder al Pago/i }));

    expect(ctx.notify).toHaveBeenCalledWith(
      "Inicia sesión para continuar con el pago",
      "error",
    );
    expect(ctx.setPage).toHaveBeenCalledWith("login");
  });
});
