import { vi } from "vitest";

export function createMockResponse({
  ok = true,
  status = 200,
  headers = { "content-type": "application/json" },
  jsonData = {},
  textData = "",
  blobData = new Blob(["test"]),
} = {}) {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    ok,
    status,
    headers: {
      get: vi.fn((key) => normalizedHeaders.get(String(key).toLowerCase()) ?? null),
    },
    json: vi.fn(async () => jsonData),
    text: vi.fn(async () => textData),
    blob: vi.fn(async () => blobData),
  };
}
