/**
 * Visitor ID utilities for guest identification
 *
 * Uses FingerprintJS for reliable browser fingerprinting
 *
 * Strategy:
 * 1. Generate a unique visitor ID (UUID v4) on first visit - stored in cookie
 * 2. Generate browser fingerprint using FingerprintJS library
 * 3. Store fingerprint in localStorage as cache (fingerprint is stable)
 */

import FingerprintJS, { Agent } from "@fingerprintjs/fingerprintjs";

// Cookie name for visitor ID
export const VISITOR_ID_COOKIE = "sf_visitor_id";
export const VISITOR_ID_STORAGE_KEY = "sf_visitor_id";
export const VISITOR_FINGERPRINT_KEY = "sf_visitor_fp";

// Cookie max age: 2 years (in seconds)
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

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
 * Get fingerprint from localStorage (cached)
 */
export function getStoredFingerprint(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(VISITOR_FINGERPRINT_KEY);
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
    localStorage.setItem(VISITOR_FINGERPRINT_KEY, fingerprint);
  } catch {
    // localStorage might be disabled
  }
}
