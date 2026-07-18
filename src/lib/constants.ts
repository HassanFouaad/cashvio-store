/**
 * Shared cookie/storage names — single source of truth.
 * Used by the middleware, API context, providers, and visitor module.
 */

/** Store ID cookie (set pre-hydration by the layout inline script) */
export const STORE_ID_COOKIE_NAME = "sf_store_id";

/** Visitor ID cookie (set by the middleware on first visit) */
export const VISITOR_ID_COOKIE_NAME = "sf_visitor_id";

/** Visitor ID localStorage backup key */
export const VISITOR_ID_STORAGE_KEY = "sf_visitor_id";

/** Cached browser fingerprint localStorage key */
export const VISITOR_FINGERPRINT_STORAGE_KEY = "sf_visitor_fp";

/** Visitor cookie lifetime: 2 years (seconds) */
export const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2;

/** Store ID cookie lifetime: 1 year (seconds) */
export const STORE_ID_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Query parameter that forces a language for the request (?lang=en|ar).
 * Powers hreflang alternates — crawlers and shared links can address each
 * language directly while regular visitors stay cookie-based.
 */
export const LANG_QUERY_PARAM = "lang";

/**
 * Internal request header set by the middleware when ?lang= is present so
 * the CURRENT render uses the requested language (the cookie only affects
 * subsequent requests).
 */
export const LOCALE_OVERRIDE_HEADER = "x-sf-locale";

/**
 * Subdomains reserved for platform infrastructure — never map to a store.
 * Mirrors the backend and tenant portal RESERVED_SUBDOMAINS constants.
 */
export const RESERVED_SUBDOMAINS: readonly string[] = [
  "www",
  "api",
  "admin",
  "app",
  "infra-monitor",
  "helpdesk",
  "infra-management",
  "console",
  "cdn",
] as const;
