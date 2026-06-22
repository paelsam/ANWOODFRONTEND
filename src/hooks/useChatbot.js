import { useCallback, useEffect, useState } from "react";
import { chatbotAPI } from "@/services/chatbot";

const SESSION_KEY = "angwood_chatbot_session";
const ENTRIES_KEY = "angwood_chatbot_entries";

function readSessionId() {
  try {
    return localStorage.getItem(SESSION_KEY) || null;
  } catch {
    return null;
  }
}

function writeSessionId(id) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

function clearEntriesStorage() {
  try {
    localStorage.removeItem(ENTRIES_KEY);
  } catch {
    /* ignore */
  }
}

export function useChatbot() {
  const [sessionId, setSessionId] = useState(readSessionId);
  const [entries, setEntries] = useState(loadEntries);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (entries.length === 0) clearEntriesStorage();
    else saveEntries(entries);
  }, [entries]);

  const ask = useCallback(
    async (query) => {
      const trimmed = query?.trim();
      if (!trimmed) return null;

      setLoading(true);
      setError(null);

      try {
        const data = await chatbotAPI.humanQuery(trimmed, sessionId);
        if (data.session_id) {
          setSessionId(data.session_id);
          writeSessionId(data.session_id);
        }
        const entry = {
          question: trimmed,
          answer: data.answer,
          ts: Date.now(),
        };
        setEntries((prev) => [...prev, entry]);
        return data;
      } catch (err) {
        const msg = err?.message || "Error al procesar la consulta.";
        setError(msg);
        setEntries((prev) => [
          ...prev,
          { question: trimmed, answer: msg, ts: Date.now(), isError: true },
        ]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId],
  );

  const startNewConversation = useCallback(async () => {
    if (sessionId) {
      try {
        await chatbotAPI.clearSession(sessionId);
      } catch {
        /* fire-and-forget */
      }
    }
    writeSessionId(null);
    setSessionId(null);
    setEntries([]);
    setError(null);
    clearEntriesStorage();
  }, [sessionId]);

  return {
    sessionId,
    entries,
    loading,
    error,
    ask,
    startNewConversation,
  };
}
