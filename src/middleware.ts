import { NextRequest, NextResponse } from "next/server";
import { getStoreCode } from "./features/store/utils/store-resolver";
import { CookieName, isValidLocale, Locale } from "./types/enums";

/**
 * Middleware Cookie Configuration
 *
 * Store-front uses store-specific cookies for:
 * - Locale (NEXT_LOCALE): Specific to each store
 * - Visitor ID (sf_visitor_id): Specific to each store
 *
 * Note: These are intentionally NOT cross-domain cookies because:
 * - Different stores may have different locales
 * - Visitor tracking should be store-specific
 *
 * For cross-app preferences (theme/language for console/portal),
 * those use 'cv_' prefixed cookies with cross-domain settings.
 */

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
const VISITOR_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 2; // 2 years
const DEFAULT_LOCALE = Locale.ARABIC;
const VISITOR_ID_COOKIE = "sf_visitor_id";

/**
 * Generate a UUID v4 for visitor ID
 */
function generateVisitorId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const storeCode = getStoreCode(hostname);

  // If no store code found in subdomain, redirect to main domain or show error
  if (!storeCode) {
    // This is the main domain without a store subdomain
    // Allow access to root pages only
    if (
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname.startsWith("/_next")
    ) {
      return handleLocaleAndVisitor(request);
    }

    // For any other paths on main domain, redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Store code found - proceed with locale and visitor handling
  return handleLocaleAndVisitor(request);
}

function handleLocaleAndVisitor(request: NextRequest) {
  // Track whether we need to set cookies
  let needsLocaleCookie = false;
  let needsVisitorCookie = false;
  let detectedLocale: Locale = DEFAULT_LOCALE;
  let visitorId = "";

  // Check locale cookie
  const localeCookie = request.cookies.get(CookieName.LOCALE)?.value;

  if (!localeCookie || !isValidLocale(localeCookie)) {
    needsLocaleCookie = true;

    // Auto-detect locale from Accept-Language header
    const acceptLanguage = request.headers.get("accept-language");

    if (acceptLanguage) {
      // Parse accept-language header
      const languages = acceptLanguage.split(",").map((lang) => {
        const [code, priority = "q=1"] = lang.trim().split(";");
        return {
          code: code.split("-")[0], // Get just 'en' from 'en-US'
          priority: parseFloat(priority.replace("q=", "")),
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
  }

  // Check visitor ID cookie
  const visitorCookie = request.cookies.get(VISITOR_ID_COOKIE)?.value;

  if (!visitorCookie) {
    needsVisitorCookie = true;
    visitorId = generateVisitorId();
  }

  // If no cookies need to be set, just pass through
  if (!needsLocaleCookie && !needsVisitorCookie) {
    return NextResponse.next();
  }

  // Set required cookies
  const response = NextResponse.next();

  if (needsLocaleCookie) {
    response.cookies.set(CookieName.LOCALE, detectedLocale, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      // No domain - store-specific cookie
    });
  }

  if (needsVisitorCookie) {
    response.cookies.set(VISITOR_ID_COOKIE, visitorId, {
      maxAge: VISITOR_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      // No domain - store-specific cookie
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
