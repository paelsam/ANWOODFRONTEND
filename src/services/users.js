import { get, post, patch, del } from "@/services/client";

export const usersAPI = {
  getUser: (user_id) => get(`/users/${user_id}`),
  list: () => get("/users"),
  create: (payload) => post("/users", payload),
  update: (user_id, payload) => patch(`/users/${user_id}`, payload),
  remove: (user_id) => patch(`/users/${user_id}/delete`),
};
