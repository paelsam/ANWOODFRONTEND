import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCart } from "@/hooks/useCart";
import {
  cartItemFixture,
  cartSummaryFixture,
  pieceFixture,
  userFixture,
} from "@/test/fixtures";

vi.mock("@/services/cart", () => ({
  cartAPI: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
  },
}));

vi.mock("@/services/inventory", () => ({
  inventoryAPI: {
    getPiece: vi.fn(),
  },
}));

import { cartAPI } from "@/services/cart";
import { inventoryAPI } from "@/services/inventory";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("useCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cartAPI.getCart.mockResolvedValue({ items: [] });
    inventoryAPI.getPiece.mockResolvedValue(pieceFixture);
  });

  it("maneja carrito local sin usuario", async () => {
    const notify = vi.fn();
    const { result } = renderHook(() =>
      useCart({ user: null, notify }),
    );

    await act(async () => {
      await result.current.addToCart({ ...cartItemFixture, id: 1, name: "Cedro" });
      await result.current.addToCart({ ...cartItemFixture, id: 1, name: "Cedro" });
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]).toMatchObject({
      id: 1,
      qty: 2,
      total_price: 240000,
    });
    expect(result.current.getCartItemCount()).toBe(2);
    expect(result.current.getCartTotal()).toBe(240000);
    expect(notify).toHaveBeenCalledWith("Cedro agregado al carrito");

    await act(async () => {
      await result.current.updateCartQty(1, 3);
    });

    expect(result.current.cart[0].qty).toBe(3);

    await act(async () => {
      await result.current.removeFromCart(1);
    });

    expect(result.current.cart).toEqual([]);
  });

  it("vacía carrito local y notifica", async () => {
    const notify = vi.fn();
    const { result } = renderHook(() =>
      useCart({ user: null, notify }),
    );

    await act(async () => {
      await result.current.addToCart({ ...cartItemFixture, id: 2, name: "Roble" });
      await result.current.clearCart();
    });

    expect(result.current.cart).toEqual([]);
    expect(notify).toHaveBeenCalledWith("Carrito vaciado correctamente");
  });

  it("hidrata carrito remoto mostrando placeholder mientras carga la pieza", async () => {
    const notify = vi.fn();
    const pieceRequest = deferred();
    cartAPI.getCart.mockResolvedValue(cartSummaryFixture);
    inventoryAPI.getPiece.mockReturnValue(pieceRequest.promise);

    const { result } = renderHook(() =>
      useCart({ user: userFixture, notify }),
    );

    await waitFor(() => {
      expect(result.current.serverCart).toEqual(cartSummaryFixture);
    });

    expect(result.current.cart[0]).toMatchObject({
      woodName: "Cargando...",
      emoji: "🪵",
      qty: 2,
    });

    pieceRequest.resolve(pieceFixture);

    await waitFor(() => {
      expect(result.current.cart[0].woodName).toBe("Cedro");
    });

    expect(result.current.cart[0]).toMatchObject({
      emoji: "🌲",
      qty: 2,
      total_price: 240000,
      stock: pieceFixture.stock,
    });
    expect(result.current.getCartItemCount()).toBe(2);
    expect(result.current.getCartTotal()).toBe(240000);
  });

  it("agrega items al carrito remoto y refresca", async () => {
    const notify = vi.fn();
    cartAPI.getCart.mockResolvedValue({ items: [] });

    const { result } = renderHook(() =>
      useCart({ user: userFixture, notify }),
    );

    await waitFor(() => {
      expect(cartAPI.getCart).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.addToCart({ id: pieceFixture.id, woodName: "Cedro" });
    });

    expect(cartAPI.addItem).toHaveBeenCalledWith(pieceFixture.id, 1);
    expect(notify).toHaveBeenCalledWith("Cedro agregado al carrito");
    expect(cartAPI.getCart).toHaveBeenCalledTimes(2);
  });

  it("notifica errores remotos al agregar", async () => {
    const notify = vi.fn();
    cartAPI.getCart.mockResolvedValue({ items: [] });
    cartAPI.addItem.mockRejectedValue(new Error("sin stock"));

    const { result } = renderHook(() =>
      useCart({ user: userFixture, notify }),
    );

    await waitFor(() => {
      expect(cartAPI.getCart).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.addToCart({ id: pieceFixture.id, woodName: "Cedro" });
    });

    expect(notify).toHaveBeenCalledWith("sin stock", "error");
  });

  it("qty cero delega a remove en modo remoto", async () => {
    cartAPI.getCart.mockResolvedValue(cartSummaryFixture);
    inventoryAPI.getPiece.mockResolvedValue(pieceFixture);

    const { result } = renderHook(() =>
      useCart({ user: userFixture, notify: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.cart[0].woodName).toBe("Cedro");
    });

    await act(async () => {
      await result.current.updateCartQty(cartSummaryFixture.items[0].id, 0);
    });

    await waitFor(() => {
      expect(cartAPI.removeItem).toHaveBeenCalledWith(cartSummaryFixture.items[0].id);
    });
  });

  it("vacía carrito remoto y notifica", async () => {
    const notify = vi.fn();
    cartAPI.getCart.mockResolvedValue(cartSummaryFixture);
    inventoryAPI.getPiece.mockResolvedValue(pieceFixture);

    const { result } = renderHook(() =>
      useCart({ user: userFixture, notify }),
    );

    await waitFor(() => {
      expect(result.current.cart[0].woodName).toBe("Cedro");
    });

    await act(async () => {
      await result.current.clearCart();
    });

    expect(cartAPI.clearCart).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith("Carrito vaciado correctamente");
  });
});
