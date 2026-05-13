import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppContext, useApp } from "@/contexts/AppContext";

describe("AppContext", () => {
  it("lanza error fuera del provider", () => {
    expect(() => renderHook(() => useApp())).toThrow(
      "useApp debe usarse dentro de <AppContext.Provider>",
    );
  });

  it("devuelve el valor del contexto dentro del provider", () => {
    const value = { page: "catalog", user: { username: "ana" } };
    const wrapper = ({ children }) => (
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current).toBe(value);
  });
});
