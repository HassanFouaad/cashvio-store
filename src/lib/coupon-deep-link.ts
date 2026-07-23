import {
    COUPON_QUERY_PARAM,
    PENDING_COUPON_STORAGE_KEY,
} from "@/lib/constants";

const MAX_COUPON_CODE_LENGTH = 64;

/**
 * Normalize a raw coupon query value. Returns null when empty/invalid.
 */
export function normalizeCouponCode(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_COUPON_CODE_LENGTH) {
    return null;
  }

  return trimmed;
}

/**
 * Persist a coupon from the URL so checkout can apply it later
 * (e.g. shopper lands on home/product with ?coupon=CODE).
 */
export function persistPendingCoupon(code: string): void {
  try {
    sessionStorage.setItem(PENDING_COUPON_STORAGE_KEY, code);
  } catch {
    // Storage unavailable — checkout still works via direct ?coupon=
  }
}

/**
 * Read and clear a previously captured coupon from sessionStorage.
 */
export function consumePendingCoupon(): string | null {
  try {
    const stored = sessionStorage.getItem(PENDING_COUPON_STORAGE_KEY);
    if (stored) {
      sessionStorage.removeItem(PENDING_COUPON_STORAGE_KEY);
    }
    return normalizeCouponCode(stored);
  } catch {
    return null;
  }
}

/** Drop any pending deep-link coupon (e.g. after a successful order). */
export function clearPendingCoupon(): void {
  try {
    sessionStorage.removeItem(PENDING_COUPON_STORAGE_KEY);
  } catch {
    // Storage unavailable
  }
}

/**
 * Capture `?coupon=` from the current URL into sessionStorage.
 * Safe to call on every page load.
 */
export function captureCouponFromUrl(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): string | null {
  const code = normalizeCouponCode(searchParams.get(COUPON_QUERY_PARAM));
  if (code) {
    persistPendingCoupon(code);
  }
  return code;
}
