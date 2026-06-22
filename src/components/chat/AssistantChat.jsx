import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useAssistantChat } from "@/hooks/useAssistantChat";
import ChatMessage from "@/components/chat/ChatMessage";
import { stripMarkdownForSpeech } from "@/utils/markdown";
import {
  loadAssistantChatOpen,
  saveAssistantChatOpen,
} from "@/utils/assistantChatStorage";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function speakText(text, lang = "es-CO") {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const plain = stripMarkdownForSpeech(text);
  const utterance = new SpeechSynthesisUtterance(plain);
  utterance.lang = lang;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export default function AssistantChat({ visible = true }) {
  const { notify, setPage } = useApp();
  const [open, setOpen] = useState(loadAssistantChatOpen);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(true);
  const listRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleReply = useCallback(
    (reply) => {
      if (speakReplies) speakText(reply);
    },
    [speakReplies],
  );

  const { messages, loading, sendMessage, clearChat } = useAssistantChat({
    onReply: handleReply,
  });

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    saveAssistantChatOpen(open);
  }, [open]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    window.speechSynthesis?.cancel();
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      notify("Tu navegador no soporta reconocimiento de voz", "info");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-CO";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      notify("No se pudo capturar el audio", "error");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        window.speechSynthesis?.cancel();
        sendMessage(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [listening, notify, sendMessage]);

  const handleLogin = useCallback(() => {
    setPage("login");
  }, [setPage]);

  if (!visible) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[210] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:bg-primary-soft hover:scale-105 cursor-pointer"
        aria-label="Abrir asistente"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[250] flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-2 border-b border-border bg-bg-soft px-4 py-3">
        <div>
          <h2 className="font-display text-base font-bold text-primary">
            Asistente ANGWOOD
          </h2>
          <p className="text-[11px] text-text-muted">
            Catálogo · Inventario · Carrito
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSpeakReplies((v) => !v);
              if (speakReplies) window.speechSynthesis?.cancel();
            }}
            className="btn btn-ghost btn-sm btn-icon"
            title={speakReplies ? "Silenciar respuestas" : "Leer respuestas"}
            aria-label={speakReplies ? "Silenciar respuestas" : "Leer respuestas"}
          >
            {speakReplies ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn btn-ghost btn-sm btn-icon"
            aria-label="Cerrar asistente"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex h-[360px] flex-col gap-3 overflow-y-auto bg-bg p-4"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <MessageCircle size={32} className="text-accent/60 mb-3" />
            <p className="text-sm text-text-muted">
              Pregúntame sobre maderas, stock o tu carrito. También puedes usar
              el micrófono.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            capability={msg.capability}
            isError={msg.isError}
            requiresLogin={msg.requiresLogin}
            onLoginClick={handleLogin}
          />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 size={16} className="animate-spin text-accent" />
            Consultando…
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border bg-surface p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          maxLength={2000}
          disabled={loading}
          className="form-input flex-1 text-sm py-2"
        />
        {SpeechRecognition && (
          <button
            type="button"
            onClick={startListening}
            disabled={loading}
            className={
              "btn btn-sm btn-icon shrink-0 " +
              (listening ? "bg-danger/15 text-danger" : "btn-ghost")
            }
            aria-label={listening ? "Detener micrófono" : "Usar micrófono"}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-primary btn-sm btn-icon shrink-0"
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </form>

      {messages.length > 0 && (
        <div className="border-t border-border px-3 py-2 bg-bg-soft">
          <button
            type="button"
            onClick={clearChat}
            className="text-[11px] text-text-subtle hover:text-accent transition"
          >
            Limpiar conversación
          </button>
        </div>
      )}
    </div>
  );
}
