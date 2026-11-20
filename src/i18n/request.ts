import { LOCALE_OVERRIDE_HEADER } from '@/lib/constants';
import { CookieName, getAllLocales, isValidLocale, Locale } from '@/types/enums';
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = getAllLocales();
// MUST match middleware DEFAULT_LOCALE — a request that bypasses the
// middleware (no cookie yet) must render the same language the middleware
// would have chosen, otherwise users see a one-request language flash.
export const defaultLocale = Locale.ARABIC;

export type LocaleType = Locale;

export default getRequestConfig(async () => {
  // 1. Resolved storefront locale forwarded by the proxy, including ?lang=
  //    and first-visit browser detection, for the CURRENT render.
  const headersList = await headers();
  const overrideValue = headersList.get(LOCALE_OVERRIDE_HEADER);

  // 2. Host-only storefront cookie (never the global Cashvio locale).
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CookieName.LOCALE)?.value;

  const locale =
    overrideValue && isValidLocale(overrideValue)
      ? overrideValue
      : cookieValue && isValidLocale(cookieValue)
        ? cookieValue
        : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
