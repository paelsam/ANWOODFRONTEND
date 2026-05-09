import { getToken } from "@/utils/token";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const token = getToken();
  const extraHeaders = options.headers || {};
  const hasExplicitContentType =
    "Content-Type" in extraHeaders || "content-type" in extraHeaders;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  if (!hasExplicitContentType) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    const detail = data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((e) => e.msg).join(", ")
          : `Error ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export const get = (path, params) => {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null),
      ).toString()
    : "";
  return request(`${path}${qs}`);
};

export const post = (path, body) =>
  request(path, { method: "POST", body: JSON.stringify(body) });

export const postForm = (path, fields) =>
  request(path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  });

export const patch = (path, body) =>
  request(path, { method: "PATCH", body: JSON.stringify(body) });

export const del = (path) => request(path, { method: "DELETE" });

export async function getBlob(path) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return await res.blob();
}
