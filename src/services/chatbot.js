import { post, del } from "@/services/client";

export const chatbotAPI = {
  humanQuery: async (human_query, session_id) => {
    const data = await post("/chatbot/human_query", { human_query, session_id });
    if (data?.error) throw new Error(data.error);
    return data;
  },
  clearSession: (session_id) => del(`/chatbot/session/${session_id}`),
};
