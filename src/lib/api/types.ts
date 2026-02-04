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

/**
 * Current locale for API requests
 * This is used to set Accept-Language header
 */
let currentLocale: Locale = Locale.ENGLISH;

export function setApiLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getApiLocale(): Locale {
  return currentLocale;
}

/**
 * ============================================
 * STORE ID CONTEXT - CRITICAL FOR MULTI-TENANT
 * ============================================
 * 
 * Store ID is managed via multiple sources for reliability:
 * - Server: Module variable set by layout.tsx
 * - Client: window.__STORE_ID__ (set by inline script BEFORE React)
 * - Client Fallback: Cookie for persistence
 * 
 * On client, window.__STORE_ID__ is the PRIMARY source because
 * the inline script runs BEFORE React hydrates, guaranteeing availability.
 */

// Cookie name for store ID - must match middleware and layout
const STORE_ID_COOKIE_NAME = 'sf_store_id';

// Declare window type augmentation
declare global {
  interface Window {
    __STORE_ID__?: string;
  }
}

/**
 * Module-level store ID - used on SERVER side only
 * On client, we always read from window.__STORE_ID__ first
 */
let serverStoreId: string | null = null;

/**
 * Set the current store ID
 * Called by:
 * - Server: layout.tsx before any API calls
 * - Client: StoreProvider (also sets window.__STORE_ID__)
 */
export function setApiStoreId(storeId: string | null): void {
  serverStoreId = storeId;
  
  // On client, also set window variable for reliability
  if (typeof window !== 'undefined' && storeId) {
    window.__STORE_ID__ = storeId;
  }
}

/**
 * Read store ID from cookie
 */
function getStoreIdFromCookie(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${STORE_ID_COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Get the current store ID
 * 
 * SERVER: Returns module variable (set by layout.tsx)
 * CLIENT: Returns from (in order of priority):
 *   1. window.__STORE_ID__ (set by inline script before React)
 *   2. Cookie fallback
 * 
 * This function is called on EVERY API request, so it must be fast and reliable.
 */
export function getApiStoreId(): string | null {
  // SERVER SIDE: Use module variable
  if (typeof window === 'undefined') {
    return serverStoreId;
  }
  
  // CLIENT SIDE: Always check window first (most reliable)
  // The inline script in layout.tsx sets this BEFORE React hydrates
  if (window.__STORE_ID__) {
    return window.__STORE_ID__;
  }
  
  // Fallback to cookie (set by middleware and layout)
  const cookieValue = getStoreIdFromCookie();
  if (cookieValue) {
    // Cache in window for next call
    window.__STORE_ID__ = cookieValue;
    return cookieValue;
  }
  
  // Last resort: module variable (might be set by StoreProvider)
  return serverStoreId;
}

/**
 * Check if store ID is available
 */
export function hasStoreId(): boolean {
  return getApiStoreId() !== null;
}
