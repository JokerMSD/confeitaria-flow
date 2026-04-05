import { resolveApiUrl } from "@/lib/api-base";

const unauthorizedEventName = "app:unauthorized";

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  suppressUnauthorizedEvent?: boolean;
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

function notifyUnauthorized() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(unauthorizedEventName));
}

export async function httpClient<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    signal,
    suppressUnauthorizedEvent = false,
  } = options;

  const response = await fetch(resolveApiUrl(url), {
    method,
    signal,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401 && !suppressUnauthorizedEvent) {
      notifyUnauthorized();
    }

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

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export { unauthorizedEventName };
