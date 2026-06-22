const STORAGE_KEY = "angwood_assistant_chat";
const OPEN_KEY = "angwood_assistant_chat_open";

export function loadAssistantChat() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { messages: [], history: [] };
    const data = JSON.parse(raw);
    return {
      messages: Array.isArray(data.messages) ? data.messages : [],
      history: Array.isArray(data.history) ? data.history : [],
    };
  } catch {
    return { messages: [], history: [] };
  }
}

export function saveAssistantChat({ messages, history }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, history }));
  } catch {
    /* ignore quota errors */
  }
}

export function clearAssistantChatStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadAssistantChatOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveAssistantChatOpen(open) {
  try {
    if (open) localStorage.setItem(OPEN_KEY, "1");
    else localStorage.removeItem(OPEN_KEY);
  } catch {
    /* ignore */
  }
}
