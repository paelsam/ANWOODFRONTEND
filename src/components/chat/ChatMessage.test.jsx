import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ChatMessage from "@/components/chat/ChatMessage";

describe("ChatMessage", () => {
  it("renderiza mensaje de usuario", () => {
    render(<ChatMessage role="user" content="Hola" />);
    expect(screen.getByText("Hola")).toBeInTheDocument();
  });

  it("renderiza mensaje del asistente con capability", () => {
    render(
      <ChatMessage
        role="assistant"
        content="Tenemos stock"
        capability="consulta_inventario"
      />,
    );
    expect(screen.getByText("Tenemos stock")).toBeInTheDocument();
    expect(screen.getByText("consulta inventario")).toBeInTheDocument();
  });

  it("renderiza markdown en respuestas del asistente", () => {
    render(
      <ChatMessage
        role="assistant"
        content="Usa **Chaquiro** en *Madera Corta*."
      />,
    );

    expect(screen.getByText("Chaquiro").tagName).toBe("STRONG");
    expect(screen.getByText("Madera Corta").tagName).toBe("EM");
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });

  it("renderiza mensaje de error", () => {
    render(
      <ChatMessage role="assistant" content="Error" isError />,
    );
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("muestra botón de iniciar sesión cuando se requiere", async () => {
    const onLoginClick = vi.fn();
    const user = userEvent.setup();

    render(
      <ChatMessage
        role="assistant"
        content="Debes iniciar sesión para continuar."
        requiresLogin
        onLoginClick={onLoginClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Iniciar sesión/i }));
    expect(onLoginClick).toHaveBeenCalled();
  });
});
