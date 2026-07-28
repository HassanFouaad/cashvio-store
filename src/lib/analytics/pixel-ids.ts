/**
 * Validation for merchant-supplied analytics IDs.
 *
 * These values are interpolated into inline <script> bodies, so a malformed
 * one is executable code rather than data. The API is the only thing that
 * enforces their format today, so they are re-checked here before they reach
 * the page: a value that predates that validation, or that was stored while
 * it was not enforced, must never be rendered.
 *
 * The patterns mirror the backend's UpsertStoreFrontWebEventsDto exactly —
 * keep them in sync.
 */

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;
const FACEBOOK_PIXEL_ID_PATTERN = /^\d{10,20}$/;
const TIKTOK_PIXEL_ID_PATTERN = /^[A-Za-z0-9]{10,40}$/;

/**
 * Returns the value only when it matches the expected shape, otherwise null
 * so the caller renders nothing. Dropping silently is deliberate: analytics
 * must never break the storefront, and this runs on pages shoppers see.
 */
function matching(
  value: string | null | undefined,
  pattern: RegExp,
): string | null {
  return value && pattern.test(value) ? value : null;
}

export function sanitizeGtmId(value?: string | null): string | null {
  return matching(value, GTM_ID_PATTERN);
}

export function sanitizeFacebookPixelId(value?: string | null): string | null {
  return matching(value, FACEBOOK_PIXEL_ID_PATTERN);
}

export function sanitizeTiktokPixelId(value?: string | null): string | null {
  return matching(value, TIKTOK_PIXEL_ID_PATTERN);
}
