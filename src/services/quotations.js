import { del, get, patch, post } from "@/services/client";

export const quotationsAPI = {
  list: (params) => get("/cotizaciones", params),
  get: (id) => get(`/cotizaciones/${id}`),
  preview: (data) => post("/cotizaciones/preview", data),
  create: (data) => post("/cotizaciones", data),
  update: (id, data) => patch(`/cotizaciones/${id}`, data),
  addDetalle: (id, data) => post(`/cotizaciones/${id}/detalles`, data),
  removeDetalle: (id, detalleId) =>
    del(`/cotizaciones/${id}/detalles/${detalleId}`),
  setEstado: (id, estado) => patch(`/cotizaciones/${id}/estado`, { estado }),
  remove: (id) => del(`/cotizaciones/${id}`),
};
