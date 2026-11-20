import { LOCALE_COOKIE_MAX_AGE_SECONDS, LANG_QUERY_PARAM } from '@/lib/constants';
import { CookieName, Locale } from '@/types/enums';

/**
 * Persist the shopper's locale preference and reload without a ?lang=
 * override so the cookie wins on the next request.
 *
 * The middleware treats ?lang=en|ar as higher priority than sf_locale
 * (for hreflang crawlers and shared links). A plain reload() therefore
 * ignores a cookie change when the URL still carries ?lang= — we strip
 * that param so the updated cookie is honored.
 */
export function applyLocaleChange(newLocale: Locale): void {
  document.cookie = `${CookieName.LOCALE}=${newLocale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;

  const url = new URL(window.location.href);
  url.searchParams.delete(LANG_QUERY_PARAM);
  // Navigating to the same URL with a fragment does not reload the document.
  // Force a reload when there is no query override left to remove.
  if (url.toString() === window.location.href) {
    window.location.reload();
    return;
  }
  window.location.assign(url.toString());
}
