import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/client", () => ({
  post: vi.fn(),
  del: vi.fn(),
}));

import { post, del } from "@/services/client";
import { chatbotAPI } from "@/services/chatbot";
import { assistantAPI } from "@/services/assistant";

describe("assistantAPI", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envía chat al endpoint del asistente", async () => {
    post.mockResolvedValue({ reply: "Hola" });
    const payload = { message: "Hola", history: [] };

    await assistantAPI.chat(payload);

    expect(post).toHaveBeenCalledWith("/assistant/chat", payload);
  });
});

describe("chatbotAPI", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lanza error si la respuesta incluye error", async () => {
    post.mockResolvedValue({ error: "Timeout" });

    await expect(chatbotAPI.humanQuery("test", null)).rejects.toThrow("Timeout");
  });

  it("devuelve datos exitosos", async () => {
    post.mockResolvedValue({ session_id: "s1", answer: "Respuesta" });

    const data = await chatbotAPI.humanQuery("test", "s1");

    expect(data.answer).toBe("Respuesta");
    expect(post).toHaveBeenCalledWith("/chatbot/human_query", {
      human_query: "test",
      session_id: "s1",
    });
  });

  it("elimina sesión", async () => {
    del.mockResolvedValue(null);
    await chatbotAPI.clearSession("abc");
    expect(del).toHaveBeenCalledWith("/chatbot/session/abc");
  });
});
