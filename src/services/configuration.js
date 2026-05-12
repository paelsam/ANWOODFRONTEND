import { del, get, patch, post } from "@/services/client";

export const configurationAPI = {
  list: () => get("/configuracion/"),
  get: (id) => get(`/configuracion/${id}`),
  create: (data) => post("/configuracion/", data),
  update: (id, data) => patch(`/configuracion/${id}`, data),
  remove: (id) => del(`/configuracion/${id}`),
};
