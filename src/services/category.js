import { del, get, patch, post } from "@/services/client";

export const categoriesAPI = {
  list: (params) => get("/categorias/", params),
  get: (id) => get(`/categorias/${id}`),
  create: (data) => post("/categorias/", data),
  update: (id, data) => patch(`/categorias/${id}`, data),
  remove: (id) => del(`/categorias/${id}`),
};
