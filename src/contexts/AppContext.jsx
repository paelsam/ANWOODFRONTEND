import { createContext, useContext } from "react";

export const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppContext.Provider>");
  return ctx;
};
