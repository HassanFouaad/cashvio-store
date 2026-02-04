/**
 * Cart types for storefront
 */

import { ApiCart, ApiCartItem } from '../api/cart.types';

// Re-export API types for convenience
export type { ApiCart, ApiCartItem };

/**
 * Cart storage key for visitor ID
 */
export const VISITOR_ID_KEY = 'sf_visitor_id';

/**
 * Generate visitor ID
 */
export function generateVisitorId(): string {
  return crypto.randomUUID();
}

/**
 * Get or create visitor ID
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') {
    return generateVisitorId();
  }

  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}
