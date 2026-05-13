import { get } from "@/services/client";

export const metricsAPI = {
  dashboard: () => get("/metricas/dashboard"),
};
