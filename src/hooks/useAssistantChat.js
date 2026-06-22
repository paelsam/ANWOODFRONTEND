import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { assistantAPI } from "@/services/assistant";
import {
  clearAssistantChatStorage,
  loadAssistantChat,
  saveAssistantChat,
} from "@/utils/assistantChatStorage";

const LOGIN_PATTERN =
  /iniciar sesi[oó]n|inicia sesi[oó]n|debes (?:iniciar|loguearte)|requiere(?:n)? (?:iniciar )?sesi[oó]n|autentic/i;

const AUTH_CAPABILITIES = new Set(["carrito_pedidos", "cotizaciones"]);

function mapAssistantError(err) {
  const msg = err?.message || "";
  if (msg.includes("503") || msg.includes("no está configurado")) {
    return "El asistente no está disponible en este momento.";
  }
  if (msg.includes("502")) {
    return "Error al procesar tu consulta. Intenta de nuevo.";
  }
  return msg || "Error al procesar tu consulta. Intenta de nuevo.";
}

function needsLoginPrompt({ reply, capability }, user) {
  if (user) return false;
  if (LOGIN_PATTERN.test(reply || "")) return true;
  return (
    capability != null &&
    AUTH_CAPABILITIES.has(capability) &&
    /sesi[oó]n|autentic|iniciar/i.test(reply || "")
  );
}

export function useAssistantChat({ onReply } = {}) {
  const { user, notify, refreshCart, setPage } = useApp();
  const stored = loadAssistantChat();
  const [messages, setMessages] = useState(stored.messages);
  const [history, setHistory] = useState(stored.history);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    saveAssistantChat({ messages, history });
  }, [messages, history]);

  const handleSideEffects = useCallback(
    ({ reply, intent, capability }) => {
      if (user && capability === "carrito_pedidos") {
        refreshCart?.();
        notify("Carrito actualizado", "info");
      }
      if (
        user &&
        capability === "cotizaciones" &&
        intent === "generar_cotizacion"
      ) {
        notify("Cotización generada", "success");
        setPage("quotation");
      }
    },
    [user, notify, refreshCart, setPage],
  );

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed || trimmed.length > 2000) return null;

      setLoading(true);
      setError(null);

      const userMsg = { role: "user", content: trimmed, id: Date.now() };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const data = await assistantAPI.chat({ message: trimmed, history });
        const assistantMsg = {
          role: "assistant",
          content: data.reply,
          intent: data.intent,
          capability: data.capability,
          requiresLogin: needsLoginPrompt(data, user),
          id: Date.now() + 1,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setHistory((prev) => [
          ...prev,
          { role: "user", content: trimmed },
          { role: "assistant", content: data.reply },
        ]);

        handleSideEffects(data);
        onReply?.(data.reply);
        return data;
      } catch (err) {
        const friendly = mapAssistantError(err);
        setError(friendly);
        notify(friendly, "error");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: friendly,
            isError: true,
            id: Date.now() + 1,
          },
        ]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [history, user, handleSideEffects, notify, onReply],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setHistory([]);
    setError(null);
    clearAssistantChatStorage();
  }, []);

  return {
    messages,
    history,
    loading,
    error,
    sendMessage,
    clearChat,
  };
}
