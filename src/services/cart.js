import { get, post, del, patch } from "@/services/client";

export const cartAPI = {
  getCart: async () => {
    return await get("/cart");
  },

  addItem: async (wood_piece_id, cantidad = 1) => {
    return await post("/cart/items", { wood_piece_id, cantidad });
  },

  updateItem: async (item_id, cantidad) => {
    if (cantidad <= 0) return await del(`/cart/items/${item_id}`);
    return await patch(`/cart/items/${item_id}`, { cantidad });
  },

  removeItem: async (item_id) => {
    return await del(`/cart/items/${item_id}`);
  },

  clearCart: async () => {
    return await del("/cart");
  },
};