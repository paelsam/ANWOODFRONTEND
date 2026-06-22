import { useEffect, useRef, useState } from "react";
import { Send, Loader2, RotateCcw } from "lucide-react";
import { useChatbot } from "@/hooks/useChatbot";
import ChatMessage from "@/components/chat/ChatMessage";

export default function AdminChatbot({ notify }) {
  const [input, setInput] = useState("");
  const listRef = useRef(null);
  const { entries, loading, ask, startNewConversation } = useChatbot();

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const query = input;
    setInput("");
    const result = await ask(query);
    if (result === null && entries.length === 0) {
      notify?.("No se pudo procesar la consulta", "error");
    }
  };

  const handleNewConversation = async () => {
    await startNewConversation();
    notify?.("Nueva conversación iniciada", "info");
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-4 min-h-[520px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-text">
            Asistente analítico
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Consultas sobre inventario, cotizaciones y métricas en lenguaje
            natural.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNewConversation}
          disabled={loading}
          className="btn btn-ghost btn-sm"
        >
          <RotateCcw size={14} />
          Nueva conversación
        </button>
      </div>

      <div
        ref={listRef}
        className="flex-1 min-h-[320px] max-h-[480px] overflow-y-auto flex flex-col gap-4 bg-bg rounded-xl border border-border p-4"
      >
        {entries.length === 0 && !loading && (
          <div className="flex flex-1 items-center justify-center text-center px-6">
            <p className="text-sm text-text-muted">
              Ejemplo: «¿Cuántas cotizaciones pendientes hay?» o «¿Cuánto
              cedro hay disponible?»
            </p>
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.ts} className="flex flex-col gap-2">
            <ChatMessage role="user" content={entry.question} />
            <ChatMessage
              role="assistant"
              content={entry.answer}
              isError={entry.isError}
            />
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-text-muted py-2">
            <Loader2 size={18} className="animate-spin text-accent" />
            Analizando datos… (puede tardar hasta 2 min)
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta analítica…"
          disabled={loading}
          className="form-input flex-1"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-primary"
        >
          <Send size={16} />
          Enviar
        </button>
      </form>
    </div>
  );
}
