import { buildApiUrl } from "./api-base";

export function resolveMediaUrl(url?: string | null) {
  if (!url) {
    return undefined;
  }

  if (
    /^https?:\/\//i.test(url) ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  return buildApiUrl(url);
}
