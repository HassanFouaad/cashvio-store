/**
 * Store Context Management
 * 
 * Re-exports from API types for backwards compatibility
 * The primary store ID management is in @/lib/api/types
 */

export { getApiStoreId, hasStoreId, setApiStoreId } from '@/lib/api/types';

// Cookie name for store ID
export const STORE_ID_COOKIE = 'sf_store_id';

/**
 * Set store ID cookie on client-side
 * Should be called when store ID is set/changed
 */
export function setStoreIdCookie(storeId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
  document.cookie = `${STORE_ID_COOKIE}=${encodeURIComponent(storeId)}; path=/; max-age=${maxAge}; samesite=lax`;
}

/**
 * Clear store ID cookie on client-side
 */
export function clearStoreIdCookie(): void {
  if (typeof window === 'undefined') {
    return;
  }

  document.cookie = `${STORE_ID_COOKIE}=; path=/; max-age=0`;
}
