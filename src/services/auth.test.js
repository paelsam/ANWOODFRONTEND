import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/client", () => ({
  post: vi.fn(),
  postForm: vi.fn(),
}));

import { post, postForm } from "@/services/client";
import { authAPI } from "@/services/auth";

describe("services/auth", () => {
  it("login delega a postForm con /token", () => {
    authAPI.login("ana", "secreto");

    expect(postForm).toHaveBeenCalledWith("/token", {
      username: "ana",
      password: "secreto",
    });
  });

  it("register delega a post con /users", () => {
    const payload = {
      username: "ana",
      email: "ana@test.dev",
      full_name: "Ana",
      password: "secret",
    };

    authAPI.register(payload);

    expect(post).toHaveBeenCalledWith("/users", payload);
  });
});
