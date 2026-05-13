import { get } from "@/services/client";

export const quotationDetailsAPI = {
  listByCotization: (cotizacion_id) =>
    get(`/cotizaciones/detalles/cotizacion/${cotizacion_id}`),
};
