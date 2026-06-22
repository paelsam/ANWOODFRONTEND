import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/assistant", () => ({
  assistantAPI: {
    chat: vi.fn(),
  },
}));

vi.mock("@/contexts/AppContext", () => ({
  useApp: vi.fn(),
}));

import { assistantAPI } from "@/services/assistant";
import { useApp } from "@/contexts/AppContext";
import { useAssistantChat } from "@/hooks/useAssistantChat";

describe("useAssistantChat", () => {
  const notify = vi.fn();
  const refreshCart = vi.fn();
  const setPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useApp.mockReturnValue({ notify, refreshCart, setPage, user: { username: "ana" } });
  });

  it("envía mensaje y actualiza historial", async () => {
    assistantAPI.chat.mockResolvedValue({
      reply: "Tenemos cedro disponible.",
      intent: "consultar_inventario",
      capability: "consulta_inventario",
    });

    const { result } = renderHook(() => useAssistantChat());

    await act(async () => {
      await result.current.sendMessage("¿Hay cedro?");
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    expect(assistantAPI.chat).toHaveBeenCalledWith({
      message: "¿Hay cedro?",
      history: [],
    });
    expect(result.current.history).toHaveLength(2);
  });

  it("refresca carrito cuando capability es carrito_pedidos", async () => {
    assistantAPI.chat.mockResolvedValue({
      reply: "Agregado al carrito.",
      intent: "agregar_al_carrito",
      capability: "carrito_pedidos",
    });

    const { result } = renderHook(() => useAssistantChat());

    await act(async () => {
      await result.current.sendMessage("Agrega cedro");
    });

    expect(refreshCart).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith("Carrito actualizado", "info");
  });

  it("navega a cotización al generar cotización", async () => {
    assistantAPI.chat.mockResolvedValue({
      reply: "Cotización COT-2026-001 generada.",
      intent: "generar_cotizacion",
      capability: "cotizaciones",
    });

    const { result } = renderHook(() => useAssistantChat());

    await act(async () => {
      await result.current.sendMessage("Genera cotización");
    });

    expect(setPage).toHaveBeenCalledWith("quotation");
    expect(notify).toHaveBeenCalledWith("Cotización generada", "success");
  });

  it("limpia conversación", async () => {
    assistantAPI.chat.mockResolvedValue({
      reply: "Hola",
      intent: null,
      capability: null,
    });

    const { result } = renderHook(() => useAssistantChat());

    await act(async () => {
      await result.current.sendMessage("Hola");
    });

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.history).toEqual([]);
  });

  it("marca requiresLogin sin redirigir cuando no hay sesión", async () => {
    useApp.mockReturnValue({ notify, refreshCart, setPage, user: null });

    assistantAPI.chat.mockResolvedValue({
      reply: "Debes iniciar sesión para agregar al carrito.",
      intent: "agregar_al_carrito",
      capability: "carrito_pedidos",
    });

    const { result } = renderHook(() => useAssistantChat());

    await act(async () => {
      await result.current.sendMessage("Agrega cedro al carrito");
    });

    expect(setPage).not.toHaveBeenCalled();
    expect(refreshCart).not.toHaveBeenCalled();
    expect(result.current.messages[1].requiresLogin).toBe(true);
  });

  it("persiste mensajes en localStorage", async () => {
    assistantAPI.chat.mockResolvedValue({
      reply: "Hola",
      intent: null,
      capability: null,
    });

    const { result } = renderHook(() => useAssistantChat());

    await act(async () => {
      await result.current.sendMessage("Hola");
    });

    const stored = JSON.parse(localStorage.getItem("angwood_assistant_chat"));
    expect(stored.messages).toHaveLength(2);
    expect(stored.history).toHaveLength(2);
  });
});
