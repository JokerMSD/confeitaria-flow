export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function httpClient<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;

  const response = await fetch(url, {
    method,
    signal,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${message}`);
  }

  return (await response.json()) as T;
}
