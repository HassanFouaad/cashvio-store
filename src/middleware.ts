import { NextRequest, NextResponse } from 'next/server';
import { Locale, CookieName, getAllLocales, isValidLocale } from './types/enums';

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
const DEFAULT_LOCALE = Locale.ARABIC;

export function middleware(request: NextRequest) {
  
  // Check if locale is in cookie
  const localeCookie = request.cookies.get(CookieName.LOCALE)?.value;
  
  if (localeCookie && isValidLocale(localeCookie)) {
    return NextResponse.next();
  }

  // Auto-detect locale from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  let detectedLocale: Locale = DEFAULT_LOCALE;

  if (acceptLanguage) {
    // Parse accept-language header
    const languages = acceptLanguage.split(',').map(lang => {
      const [code, priority = 'q=1'] = lang.trim().split(';');
      return {
        code: code.split('-')[0], // Get just 'en' from 'en-US'
        priority: parseFloat(priority.replace('q=', '')),
      };
    });

    // Sort by priority
    languages.sort((a, b) => b.priority - a.priority);

    // Find first supported locale
    for (const lang of languages) {
      if (isValidLocale(lang.code)) {
        detectedLocale = lang.code;
        break;
      }
    }
  }

  // Set cookie with detected locale
  const response = NextResponse.next();
  response.cookies.set(CookieName.LOCALE, detectedLocale, {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
