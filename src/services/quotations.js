import { del, get, patch, post } from "@/services/client";

export const quotationsAPI = {
  list: (params) => get("/cotizaciones", params),
  get: (id) => get(`/cotizaciones/${id}`),
  create: (data) => post("/cotizaciones", data),
  update: (id, data) => patch(`/cotizaciones/${id}`, data),
  remove: (id) => del(`/cotizaciones/${id}`),
};
