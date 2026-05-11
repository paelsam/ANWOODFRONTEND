import { get, post, patch, del } from "@/services/client";

export const inventoryAPI = {
  listWoodTypes: (params) => get("/wood-types", params),
  getWoodType: (id) => get(`/wood-types/${id}`),
  createWoodType: (data) => post("/wood-types", data),
  updateWoodType: (id, data) => patch(`/wood-types/${id}`, data),
  deleteWoodType: (id) => del(`/wood-types/${id}`),

  listPieces: (params) => get("/piezas", params),
  getPiece: (id) => get(`/piezas/${id}`),
  createPiece: (data) => post("/piezas", data),
  updatePiece: (id, data) => patch(`/piezas/${id}`, data),
  deletePiece: (id) => del(`/piezas/${id}`),
};