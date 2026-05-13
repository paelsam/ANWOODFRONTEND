import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useNotification } from "@/hooks/useNotification";

describe("useNotification", () => {
  it("inicia sin notificación", () => {
    const { result } = renderHook(() => useNotification());

    expect(result.current.notification).toBeNull();
  });

  it("usa success por defecto y luego limpia tras 3500ms", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.notify("Hola");
    });

    expect(result.current.notification).toEqual({
      msg: "Hola",
      type: "success",
    });

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(result.current.notification).toBeNull();
  });

  it("permite un tipo explícito", () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.notify("Fallo", "error");
    });

    expect(result.current.notification).toEqual({
      msg: "Fallo",
      type: "error",
    });
  });
});
