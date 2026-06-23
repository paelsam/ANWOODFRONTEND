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
  CircleStop,
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

function speakText(text, lang = "es-CO", onStart, onEnd) {
  if (!window.speechSynthesis || !text) return;

  window.speechSynthesis.cancel();

  const plain = stripMarkdownForSpeech(text);
  const utterance = new SpeechSynthesisUtterance(plain);

  utterance.lang = lang;
  utterance.rate = 0.95;

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = () => {
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

export default function AssistantChat({ visible = true }) {
  const { notify, setPage } = useApp();
  const [open, setOpen] = useState(loadAssistantChatOpen);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const listRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const listeningRef = useRef(false);
  const ttsSpeakingRef = useRef(false);
  const micWasActiveBeforeTTSRef = useRef(false);

  const handleReply = useCallback(
    (reply) => {

      if (!speakReplies) return;

      speakText(
        reply,
        "es-CO",
        () => {
          ttsSpeakingRef.current = true;
          setIsSpeaking(true);

          micWasActiveBeforeTTSRef.current = listeningRef.current;

          if (listeningRef.current) {
            recognitionRef.current?.stop();
            setListening(false);
            listeningRef.current = false;
          }
        },
        () => {
          ttsSpeakingRef.current = false;
          setIsSpeaking(false);

          if (micWasActiveBeforeTTSRef.current) {
            startListening();
          }
        }
      );
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

      listeningRef.current = false;

      clearTimeout(silenceTimerRef.current);

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

    // Toggle: detener
    if (listeningRef.current) {

      listeningRef.current = false;

      clearTimeout(silenceTimerRef.current);

      recognitionRef.current?.stop();

      setListening(false);

      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "es-CO";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {

      listeningRef.current = true;

      setListening(true);

    };

    recognition.onend = () => {

      if (listeningRef.current) {

        recognition.start();

      } else {

        setListening(false);

      }

    };

    recognition.onerror = () => {

      listeningRef.current = false;

      setListening(false);

      notify("No se pudo capturar el audio", "error");

    };

    recognition.onresult = (event) => {

      if (ttsSpeakingRef.current) return;

      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        transcript += event.results[i][0].transcript;

      }

      transcript = transcript.trim();

      setInput(transcript);

      clearTimeout(silenceTimerRef.current);

      silenceTimerRef.current = setTimeout(async () => {

        if (!transcript || loading) return;

        window.speechSynthesis?.cancel();

        setInput("");

        await sendMessage(transcript);

      }, 1500);

    };

    recognitionRef.current = recognition;

    recognition.start();

  }, [notify, sendMessage, loading]);

  const stopSpeaking = () => {
  window.speechSynthesis?.cancel();
  ttsSpeakingRef.current = false;
  setIsSpeaking(false);
};

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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            role="switch"
            aria-checked={speakReplies}
            onClick={() => {

              setSpeakReplies((v) => {
                const next = !v;

                if (!next) {
                  window.speechSynthesis?.cancel();
                  ttsSpeakingRef.current = false;
                  setIsSpeaking(false);
                }

                return next;
              });

              window.speechSynthesis?.cancel();

              if (listeningRef.current && !speakReplies) {
                micWasActiveBeforeTTSRef.current = true;
              }

              if (micWasActiveBeforeTTSRef.current && !speakReplies) {
                setTimeout(() => {
                  startListening();
                }, 200);
              }
            }}
            title={speakReplies ? "Silenciar respuestas" : "Leer respuestas"}
            aria-label={speakReplies ? "Silenciar respuestas" : "Leer respuestas"}
            className={
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 " +
              (speakReplies ? "bg-primary" : "bg-border")
            }
          >
            <span
              className={
                "absolute left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 " +
                (speakReplies ? "translate-x-5" : "translate-x-0")
              }
            >
              {speakReplies ? (
                <Volume2 size={11} className="text-primary" />
              ) : (
                <VolumeX size={11} className="text-text-subtle" />
              )}
            </span>
          </button>

          {speakReplies && isSpeaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="btn btn-ghost btn-sm btn-icon"
              title="Detener lectura"
              aria-label="Detener lectura"
            >
              <CircleStop size={16} />
            </button>
          )}

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