export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL?.trim() || "";
}

export function resolveApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return path;
  }

  return new URL(path, baseUrl).toString();
}

export const buildApiUrl = resolveApiUrl;
