import { del, get, patch, post } from "@/services/client";

export const clientsAPI = {
  list: (activo) => get("/clientes", activo != null ? { activo } : undefined),
  get: (id) => get(`/clientes/${id}`),
  create: (data) => post("/clientes", data),
  update: (id, data) => patch(`/clientes/${id}`, data),
  remove: (id) => del(`/clientes/${id}`),
};
