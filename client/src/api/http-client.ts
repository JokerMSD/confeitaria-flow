import { resolveApiUrl } from "@/lib/api-base";

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function httpClient<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;

  const response = await fetch(resolveApiUrl(url), {
    method,
    signal,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const payload = await response.json().catch(() => null);
      const message =
        payload && typeof payload === "object" && "message" in payload
          ? String(payload.message)
          : response.statusText;

      throw new ApiError(response.status, message, payload);
    }

    const message = (await response.text()) || response.statusText;
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}
