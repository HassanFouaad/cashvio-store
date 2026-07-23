/**
 * Ensure an image/URL is absolute for Open Graph / social crawlers.
 * Relative paths resolve against the current store hostname.
 */
export function toAbsoluteUrl(url: string, hostname: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  const host = hostname.replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `https://${host}${path}`;
}
