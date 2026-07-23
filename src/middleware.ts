import { NextRequest, NextResponse } from "next/server";
import {
    StoreFrontFontPreset,
    StoreFrontRadiusPreset,
} from "./features/store/types/store.types";
import { getStoreSubdomain } from "./features/store/utils/store-resolver";
import {
    LANG_QUERY_PARAM,
    LOCALE_OVERRIDE_HEADER,
    THEME_PREVIEW_CUSTOM_PARAM,
    THEME_PREVIEW_FONT_PARAM,
    THEME_PREVIEW_HEADER,
    THEME_PREVIEW_PALETTE_PARAM,
    THEME_PREVIEW_RADIUS_PARAM,
    THEME_PREVIEW_THEME_PARAM,
    VISITOR_COOKIE_MAX_AGE_SECONDS,
    VISITOR_ID_COOKIE_NAME,
} from "./lib/constants";
import {
    THEME_PREVIEW_CUSTOM_HEX_REGEX,
    THEME_PREVIEW_UUID_REGEX,
} from "./lib/theme/theme-constants";
import { CookieName, isValidLocale, Locale } from "./types/enums";

/**
 * Middleware Cookie Configuration
 *
 * Store-front uses store-specific cookies for:
 * - Locale (NEXT_LOCALE): Specific to each store
 * - Visitor ID (sf_visitor_id): Specific to each store
 * - Store ID (sf_store_id): For API requests
 *
 * Note: These are intentionally NOT cross-domain cookies because:
 * - Different stores may have different locales
 * - Visitor tracking should be store-specific
 *
 * For cross-app preferences (theme/language for console/portal),
 * those use 'cv_' prefixed cookies with cross-domain settings.
 */

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
const DEFAULT_LOCALE = Locale.ARABIC;

/**
 * Generate a UUID v4 for visitor ID.
 * crypto.randomUUID is available in the middleware runtime; the manual
 * fallback only guards exotic self-hosted environments.
 */
function generateVisitorId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const storeSubdomain = getStoreSubdomain(hostname);

  // If no store subdomain found in subdomain, redirect to main domain or show error
  if (!storeSubdomain) {
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

/**
 * Validate ?preview_theme / ?preview_palette / ?preview_font /
 * ?preview_radius and pack them into a JSON header for the render (layouts
 * cannot read query params). Strict allowlists: anything invalid is
 * silently dropped — preview params are cosmetic-only and never trusted.
 */
function buildThemePreviewHeader(request: NextRequest): string | null {
  const themeParam = request.nextUrl.searchParams.get(
    THEME_PREVIEW_THEME_PARAM,
  );
  const paletteParam = request.nextUrl.searchParams.get(
    THEME_PREVIEW_PALETTE_PARAM,
  );
  const customParam = request.nextUrl.searchParams.get(
    THEME_PREVIEW_CUSTOM_PARAM,
  );
  const fontParam = request.nextUrl.searchParams.get(THEME_PREVIEW_FONT_PARAM);
  const radiusParam = request.nextUrl.searchParams.get(
    THEME_PREVIEW_RADIUS_PARAM,
  );

  const preview: { t?: string; p?: string; c?: string; f?: string; r?: string } =
    {};

  if (themeParam && THEME_PREVIEW_UUID_REGEX.test(themeParam)) {
    preview.t = themeParam;
  }
  if (paletteParam && THEME_PREVIEW_UUID_REGEX.test(paletteParam)) {
    preview.p = paletteParam;
  }
  if (customParam && THEME_PREVIEW_CUSTOM_HEX_REGEX.test(customParam)) {
    preview.c = customParam;
  }
  if (
    fontParam &&
    Object.values(StoreFrontFontPreset).includes(
      fontParam as StoreFrontFontPreset,
    )
  ) {
    preview.f = fontParam;
  }
  if (
    radiusParam &&
    Object.values(StoreFrontRadiusPreset).includes(
      radiusParam as StoreFrontRadiusPreset,
    )
  ) {
    preview.r = radiusParam;
  }

  return Object.keys(preview).length > 0 ? JSON.stringify(preview) : null;
}

function handleLocaleAndVisitor(request: NextRequest) {
  // Track whether we need to set cookies
  let needsLocaleCookie = false;
  let needsVisitorCookie = false;
  let detectedLocale: Locale = DEFAULT_LOCALE;
  let visitorId = "";

  // ?lang=en|ar forces the language for THIS request and persists it.
  // Powers hreflang alternate URLs and language-specific shared links.
  const langParam = request.nextUrl.searchParams.get(LANG_QUERY_PARAM);
  const langOverride =
    langParam && isValidLocale(langParam) ? langParam : null;

  // Theme preview draft (portal editor iframe) — request-scoped only,
  // never persisted in cookies.
  const themePreviewHeader = buildThemePreviewHeader(request);

  // Check locale cookie
  const localeCookie = request.cookies.get(CookieName.LOCALE)?.value;

  if (langOverride) {
    detectedLocale = langOverride;
    needsLocaleCookie = langOverride !== localeCookie;
  } else if (!localeCookie || !isValidLocale(localeCookie)) {
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
  const visitorCookie = request.cookies.get(VISITOR_ID_COOKIE_NAME)?.value;

  if (!visitorCookie) {
    needsVisitorCookie = true;
    visitorId = generateVisitorId();
  }

  // If nothing needs forwarding or persisting, pass through untouched
  if (
    !needsLocaleCookie &&
    !needsVisitorCookie &&
    !langOverride &&
    !themePreviewHeader
  ) {
    return NextResponse.next();
  }

  // Forward per-request overrides (language, theme preview) to the CURRENT
  // render via request headers — response cookies only affect later requests.
  let response: NextResponse;
  if (langOverride || themePreviewHeader) {
    const requestHeaders = new Headers(request.headers);
    if (langOverride) {
      requestHeaders.set(LOCALE_OVERRIDE_HEADER, langOverride);
    }
    if (themePreviewHeader) {
      requestHeaders.set(THEME_PREVIEW_HEADER, themePreviewHeader);
    }
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next();
  }

  if (needsLocaleCookie) {
    response.cookies.set(CookieName.LOCALE, detectedLocale, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      // No domain - store-specific cookie
    });
  }

  if (needsVisitorCookie) {
    response.cookies.set(VISITOR_ID_COOKIE_NAME, visitorId, {
      maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
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
