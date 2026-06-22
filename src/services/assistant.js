import { post } from "@/services/client";

export const assistantAPI = {
  chat: ({ message, history }) =>
    post("/assistant/chat", { message, history }),
};
