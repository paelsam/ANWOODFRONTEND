import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/chatbot", () => ({
  chatbotAPI: {
    humanQuery: vi.fn(),
    clearSession: vi.fn(),
  },
}));

import { chatbotAPI } from "@/services/chatbot";
import { useChatbot } from "@/hooks/useChatbot";

describe("useChatbot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("envía consulta y guarda session_id", async () => {
    chatbotAPI.humanQuery.mockResolvedValue({
      session_id: "abc-123",
      answer: "Hay 15 unidades de cedro.",
    });

    const { result } = renderHook(() => useChatbot());

    await act(async () => {
      await result.current.ask("¿Cuánto cedro hay?");
    });

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(1);
    });

    expect(chatbotAPI.humanQuery).toHaveBeenCalledWith(
      "¿Cuánto cedro hay?",
      null,
    );
    expect(result.current.sessionId).toBe("abc-123");
    expect(localStorage.getItem("angwood_chatbot_session")).toBe("abc-123");
  });

  it("maneja errores del backend", async () => {
    chatbotAPI.humanQuery.mockRejectedValue(
      new Error("La consulta tardó demasiado"),
    );

    const { result } = renderHook(() => useChatbot());

    await act(async () => {
      await result.current.ask("Consulta lenta");
    });

    expect(result.current.entries[0].isError).toBe(true);
  });

  it("inicia nueva conversación", async () => {
    localStorage.setItem("angwood_chatbot_session", "old-session");
    localStorage.setItem(
      "angwood_chatbot_entries",
      JSON.stringify([{ question: "prev", answer: "ok", ts: 1 }]),
    );
    chatbotAPI.clearSession.mockResolvedValue({ message: "cleared" });
    chatbotAPI.humanQuery.mockResolvedValue({
      session_id: "new-session",
      answer: "Respuesta",
    });

    const { result } = renderHook(() => useChatbot());

    await act(async () => {
      await result.current.ask("Pregunta");
    });

    await act(async () => {
      await result.current.startNewConversation();
    });

    expect(chatbotAPI.clearSession).toHaveBeenCalledWith("new-session");
    expect(result.current.entries).toEqual([]);
    expect(localStorage.getItem("angwood_chatbot_session")).toBeNull();
    expect(localStorage.getItem("angwood_chatbot_entries")).toBeNull();
  });

  it("restaura entradas desde localStorage", () => {
    localStorage.setItem(
      "angwood_chatbot_entries",
      JSON.stringify([{ question: "¿Stock?", answer: "15 unidades", ts: 99 }]),
    );

    const { result } = renderHook(() => useChatbot());
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].question).toBe("¿Stock?");
  });
});
