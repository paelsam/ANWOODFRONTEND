import { get, post } from "@/services/client";

export const usersAPI = {
  getUser: (user_id) => get(`/users/${user_id}`),
  list: () => get("/users"),
  create: (payload) => post("/users", payload),
};
