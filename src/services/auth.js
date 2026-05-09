import { post, postForm } from "@/services/client";

export const authAPI = {
  login: (username, password) => postForm("/token", { username, password }),
  register: ({ username, email, full_name, password }) =>
    post("/users", { username, email, full_name, password }),
};
