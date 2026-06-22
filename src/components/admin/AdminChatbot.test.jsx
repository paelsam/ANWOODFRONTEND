import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useChatbot", () => ({
  useChatbot: vi.fn(),
}));

import { useChatbot } from "@/hooks/useChatbot";
import AdminChatbot from "@/components/admin/AdminChatbot";

describe("AdminChatbot", () => {
  const ask = vi.fn();
  const startNewConversation = vi.fn();
  const notify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useChatbot.mockReturnValue({
      entries: [],
      loading: false,
      ask,
      startNewConversation,
    });
  });

  it("renderiza título y placeholder", () => {
    render(<AdminChatbot notify={notify} />);
    expect(screen.getByText("Asistente analítico")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Escribe tu consulta analítica…"),
    ).toBeInTheDocument();
  });

  it("envía consulta al submit", async () => {
    ask.mockResolvedValue({ answer: "15 cotizaciones" });
    const user = userEvent.setup();
    render(<AdminChatbot notify={notify} />);

    await user.type(
      screen.getByPlaceholderText("Escribe tu consulta analítica…"),
      "¿Cuántas cotizaciones?",
    );
    await user.click(screen.getByRole("button", { name: /Enviar/i }));

    expect(ask).toHaveBeenCalledWith("¿Cuántas cotizaciones?");
  });

  it("inicia nueva conversación", async () => {
    const user = userEvent.setup();
    render(<AdminChatbot notify={notify} />);

    await user.click(screen.getByRole("button", { name: /Nueva conversación/i }));

    expect(startNewConversation).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith("Nueva conversación iniciada", "info");
  });
});
