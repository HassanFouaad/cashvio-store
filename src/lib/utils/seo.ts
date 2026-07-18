import { LANG_QUERY_PARAM } from "@/lib/constants";
import { Locale } from "@/types/enums";

/**
 * hreflang alternate URLs for a bilingual page.
 *
 * The storefront serves both languages on the same path (cookie-based),
 * and the middleware honors `?lang=en|ar` as an explicit override — these
 * alternates make each language crawlable and addressable. `x-default`
 * points at the clean URL (auto-detected language).
 *
 * URLs are relative and resolve against `metadataBase` (set in the layout).
 */
export function buildLanguageAlternates(
  path: string,
): Record<string, string> {
  const separator = path.includes("?") ? "&" : "?";

  return {
    [Locale.ENGLISH]: `${path}${separator}${LANG_QUERY_PARAM}=${Locale.ENGLISH}`,
    [Locale.ARABIC]: `${path}${separator}${LANG_QUERY_PARAM}=${Locale.ARABIC}`,
    "x-default": path,
  };
}
