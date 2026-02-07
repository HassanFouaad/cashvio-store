/**
 * Core API types and interfaces
 * Matches the actual backend response structure from ResponseTransformer
 */

/**
 * ============================================
 * API RESPONSE TYPES
 * ============================================
 */

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/**
 * API Response meta structure
 * Non-paginated: { timestamp }
 * Paginated: { timestamp, pagination }
 */
export interface ApiResponseMeta {
  timestamp: string;
  pagination?: PaginationMeta; // Only present for paginated responses
  [key: string]: unknown;
}

/**
 * Standard API response structure
 * Works for both paginated and non-paginated responses
 * 
 * Non-paginated: { success, data: T, meta: { timestamp } }
 * Paginated: { success, data: T[], meta: { timestamp, pagination: {...} } }
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: ApiResponseMeta;
}

/**
 * Application-level paginated response (transformed for easier use)
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * API error response
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    path?: string;
  };
}

/**
 * API Exception class for structured error handling
 */
export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error?: string
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

/**
 * ============================================
 * QUERY TYPES
 * ============================================
 */

/**
 * Query parameters for pagination
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * Extended fetch options with timeout support
 */
export interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * ============================================
 * LOCALE CONTEXT
 * ============================================
 */

import { Locale } from "@/types/enums";
import { cache } from "react";

/**
 * Server-side request-scoped locale using React cache().
 * React.cache() creates a memoized function that returns the SAME object
 * per server request, preventing race conditions between concurrent requests.
 * On the client, it returns the same object (effectively a singleton, which is fine).
 */
const getServerLocaleContext = cache(() => ({
  locale: Locale.ENGLISH as Locale,
}));

/**
 * Client-side locale (module variable is fine since client is single-threaded)
 */
let clientLocale: Locale = Locale.ENGLISH;

export function setApiLocale(locale: Locale): void {
  if (typeof window !== "undefined") {
    clientLocale = locale;
    return;
  }
  // Server-side: set in request-scoped cache
  getServerLocaleContext().locale = locale;
}

export function getApiLocale(): Locale {
  if (typeof window === "undefined") {
    return getServerLocaleContext().locale;
  }
  return clientLocale;
}

/**
 * ============================================
 * STORE ID CONTEXT - CRITICAL FOR MULTI-TENANT
 * ============================================
 *
 * ARCHITECTURE:
 *
 * SERVER SIDE:
 *   Uses React.cache() to create REQUEST-SCOPED store ID.
 *   This prevents race conditions when multiple tenant requests
 *   are processed concurrently in production. Each server request
 *   gets its own isolated store ID context.
 *
 *   Set by: layout.tsx generateMetadata() AND component body
 *   Read by: All server-side API calls via apiClient.getHeaders()
 *
 * CLIENT SIDE:
 *   Uses window.__STORE_ID__ as PRIMARY source (set by inline script
 *   in <head> BEFORE React hydrates, guaranteeing availability).
 *   Cookie fallback for persistence across page loads.
 *
 *   Set by: Inline script in layout.tsx <head>, StoreProvider useEffect
 *   Read by: All client-side API calls (cart, checkout, etc.)
 */

// Cookie name for store ID - must match middleware and layout
const STORE_ID_COOKIE_NAME = "sf_store_id";

// Declare window type augmentation
declare global {
  interface Window {
    __STORE_ID__?: string;
  }
}

/**
 * Server-side request-scoped store ID using React cache().
 *
 * CRITICAL: This replaces the old module-level `serverStoreId` variable
 * which was shared across ALL concurrent requests, causing:
 * - Wrong store ID sent to backend for concurrent requests
 * - "Store ID is required" errors (400)
 * - Wrong tenant data returned (404)
 *
 * React.cache() ensures each server request gets its own object.
 */
const getServerStoreContext = cache(() => ({
  storeId: null as string | null,
}));

/**
 * Set the current store ID.
 *
 * Called by:
 * - Server: layout.tsx generateMetadata() (for child page metadata)
 * - Server: layout.tsx component body (for child page components)
 * - Client: StoreProvider (keeps window.__STORE_ID__ in sync on navigation)
 */
export function setApiStoreId(storeId: string | null): void {
  if (typeof window !== "undefined") {
    // Client-side: set window variable (primary source for client API calls)
    if (storeId) {
      window.__STORE_ID__ = storeId;
    }
    return;
  }
  // Server-side: set in request-scoped cache
  getServerStoreContext().storeId = storeId;
}

/**
 * Read store ID from cookie (client-side only)
 */
function getStoreIdFromCookie(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${STORE_ID_COOKIE_NAME}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Get the current store ID.
 *
 * SERVER: Returns from request-scoped React.cache() context.
 *         Safe for concurrent requests - each request has its own value.
 *
 * CLIENT: Returns from (in order of priority):
 *   1. window.__STORE_ID__ (set by inline script before React hydrates)
 *   2. Cookie fallback (set by layout inline script)
 *
 * This function is called on EVERY API request, so it must be fast and reliable.
 */
export function getApiStoreId(): string | null {
  // SERVER SIDE: Read from request-scoped cache
  if (typeof window === "undefined") {
    return getServerStoreContext().storeId;
  }

  // CLIENT SIDE: Check window first (most reliable - set before React hydrates)
  if (window.__STORE_ID__) {
    return window.__STORE_ID__;
  }

  // Fallback to cookie (set by inline script in layout)
  const cookieValue = getStoreIdFromCookie();
  if (cookieValue) {
    // Cache in window for subsequent calls
    window.__STORE_ID__ = cookieValue;
    return cookieValue;
  }

  return null;
}

/**
 * Check if store ID is available
 */
export function hasStoreId(): boolean {
  return getApiStoreId() !== null;
}
