import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useAssistantChat", () => ({
  useAssistantChat: vi.fn(),
}));

import { useAssistantChat } from "@/hooks/useAssistantChat";
import AssistantChat from "@/components/chat/AssistantChat";
import { renderWithApp } from "@/test/helpers/renderWithApp";

describe("AssistantChat", () => {
  const sendMessage = vi.fn();
  const clearChat = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAssistantChat.mockReturnValue({
      messages: [],
      loading: false,
      sendMessage,
      clearChat,
    });
    window.speechSynthesis = { cancel: vi.fn(), speak: vi.fn() };
  });

  it("muestra FAB cerrado por defecto", () => {
    renderWithApp(<AssistantChat />);
    expect(screen.getByRole("button", { name: "Abrir asistente" })).toBeInTheDocument();
  });

  it("abre panel y envía mensaje", async () => {
    const user = userEvent.setup();
    renderWithApp(<AssistantChat />);

    await user.click(screen.getByRole("button", { name: "Abrir asistente" }));
    expect(screen.getByText("Asistente ANGWOOD")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Escribe tu pregunta…"),
      "¿Hay cedro?",
    );
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(sendMessage).toHaveBeenCalledWith("¿Hay cedro?");
  });

  it("muestra mensajes del historial", async () => {
    useAssistantChat.mockReturnValue({
      messages: [
        { id: 1, role: "user", content: "Hola" },
        { id: 2, role: "assistant", content: "Bienvenido" },
      ],
      loading: false,
      sendMessage,
      clearChat,
    });

    const user = userEvent.setup();
    renderWithApp(<AssistantChat />);
    await user.click(screen.getByRole("button", { name: "Abrir asistente" }));

    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getByText("Bienvenido")).toBeInTheDocument();
  });
});
