import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { Locale, CookieName, getAllLocales, isValidLocale } from '@/types/enums';

export const locales = getAllLocales();
export const defaultLocale = Locale.ENGLISH;

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
