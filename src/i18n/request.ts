import { CookieName, getAllLocales, isValidLocale, Locale } from '@/types/enums';
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = getAllLocales();
// MUST match middleware DEFAULT_LOCALE — a request that bypasses the
// middleware (no cookie yet) must render the same language the middleware
// would have chosen, otherwise users see a one-request language flash.
export const defaultLocale = Locale.ARABIC;

export type LocaleType = Locale;

export default getRequestConfig(async () => {
  // Get locale from cookie (set by middleware with auto-detection)
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CookieName.LOCALE)?.value;
  
  // Validate and use locale, fallback to default if invalid
  const locale = cookieValue && isValidLocale(cookieValue) 
    ? cookieValue 
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
