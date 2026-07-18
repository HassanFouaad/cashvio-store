/**
 * Visitor identity — THE single implementation.
 *
 * The visitor ID identifies a guest across cart, checkout, coupons and
 * analytics, so every consumer MUST resolve it identically:
 *
 * 1. Cookie (source of truth — the middleware mints it on first response)
 * 2. localStorage backup (survives cookie clearing)
 * 3. Freshly generated UUID (only when both are missing)
 *
 * Whatever is resolved is healed back into BOTH storages so all layers
 * agree. Never read/generate visitor IDs anywhere else.
 */

import {
  VISITOR_COOKIE_MAX_AGE_SECONDS,
  VISITOR_FINGERPRINT_STORAGE_KEY,
  VISITOR_ID_COOKIE_NAME,
  VISITOR_ID_STORAGE_KEY,
} from "@/lib/constants";
import FingerprintJS, { Agent } from "@fingerprintjs/fingerprintjs";

// Singleton FingerprintJS agent promise
let fpPromise: Promise<Agent> | null = null;

/**
 * Get FingerprintJS agent (singleton)
 */
async function getFingerprintAgent() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }

  return fpPromise;
}

/**
 * Generate browser fingerprint using FingerprintJS
 * Returns the visitorId from FingerprintJS which is a hash of browser attributes
 */
export async function generateFingerprint(): Promise<string> {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const agent = await getFingerprintAgent();
    if (!agent) {
      return "";
    }

    const result = await agent.get();
    return result.visitorId;
  } catch (error) {
    console.error("[Fingerprint] Error generating fingerprint:", error);
    return "";
  }
}

/**
 * Generate a UUID v4
 * Uses crypto.randomUUID when available, fallback for older browsers
 */
export function generateVisitorId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Read the visitor ID from the cookie (client-side)
 */
export function getVisitorIdFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex === -1) continue;

    const name = cookie.slice(0, separatorIndex).trim();
    if (name === VISITOR_ID_COOKIE_NAME) {
      return decodeURIComponent(cookie.slice(separatorIndex + 1));
    }
  }
  return null;
}

/**
 * Persist the visitor ID cookie (store-specific — no domain set)
 */
export function setVisitorIdCookie(visitorId: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + VISITOR_COOKIE_MAX_AGE_SECONDS * 1000);

  document.cookie = `${VISITOR_ID_COOKIE_NAME}=${encodeURIComponent(visitorId)}; expires=${expires.toUTCString()}; path=/; samesite=lax`;
}

/**
 * Get visitor ID from localStorage (client-side backup)
 */
export function getStoredVisitorId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(VISITOR_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store visitor ID in localStorage
 */
export function storeVisitorId(visitorId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
  } catch {
    // localStorage might be disabled
  }
}

/**
 * Resolve the visitor ID — cookie first, localStorage backup, generate last.
 * Heals both storages so cart, checkout, and tracking always agree.
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") {
    // SSR safety net — real resolution always happens client-side
    return generateVisitorId();
  }

  const visitorId =
    getVisitorIdFromCookie() ?? getStoredVisitorId() ?? generateVisitorId();

  setVisitorIdCookie(visitorId);
  storeVisitorId(visitorId);

  return visitorId;
}

/**
 * Get fingerprint from localStorage (cached)
 */
export function getStoredFingerprint(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(VISITOR_FINGERPRINT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store fingerprint in localStorage
 */
export function storeFingerprint(fingerprint: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(VISITOR_FINGERPRINT_STORAGE_KEY, fingerprint);
  } catch {
    // localStorage might be disabled
  }
}
