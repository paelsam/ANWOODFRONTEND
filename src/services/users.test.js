import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/client", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import { get, patch, post } from "@/services/client";
import { usersAPI } from "@/services/users";

describe("services/users", () => {
  it("getUser y list usan get", () => {
    usersAPI.getUser(1);
    usersAPI.list();

    expect(get).toHaveBeenNthCalledWith(1, "/users/1");
    expect(get).toHaveBeenNthCalledWith(2, "/users");
  });

  it("create y update delegan a post y patch", () => {
    const payload = { username: "ana" };

    usersAPI.create(payload);
    usersAPI.update(1, payload);

    expect(post).toHaveBeenCalledWith("/users", payload);
    expect(patch).toHaveBeenCalledWith("/users/1", payload);
  });

  it("remove inactiva con patch a /delete", () => {
    usersAPI.remove(4);

    expect(patch).toHaveBeenCalledWith("/users/4/delete");
  });
});
