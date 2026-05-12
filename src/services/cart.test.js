import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { del, get, patch, post } from "@/services/client";
import { cartAPI } from "@/services/cart";

describe("services/cart", () => {
  it("getCart usa /cart", async () => {
    await cartAPI.getCart();

    expect(get).toHaveBeenCalledWith("/cart");
  });

  it("addItem usa /cart/items con payload", async () => {
    await cartAPI.addItem(40, 3);

    expect(post).toHaveBeenCalledWith("/cart/items", {
      wood_piece_id: 40,
      cantidad: 3,
    });
  });

  it("updateItem usa patch cuando cantidad es positiva", async () => {
    await cartAPI.updateItem(5, 2);

    expect(patch).toHaveBeenCalledWith("/cart/items/5", { cantidad: 2 });
  });

  it("updateItem usa delete cuando cantidad es cero o menor", async () => {
    await cartAPI.updateItem(5, 0);

    expect(del).toHaveBeenCalledWith("/cart/items/5");
  });

  it("removeItem elimina el item por id", async () => {
    await cartAPI.removeItem(7);

    expect(del).toHaveBeenCalledWith("/cart/items/7");
  });

  it("clearCart elimina /cart", async () => {
    await cartAPI.clearCart();

    expect(del).toHaveBeenCalledWith("/cart");
  });
});
