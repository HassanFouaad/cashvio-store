/**
 * Cart helper utilities
 * Simple pure functions for cart operations
 */

import { ApiCart } from '../api/cart.types';

/**
 * Check if cart has items
 */
export function hasItems(cart: ApiCart | null): boolean {
  return (cart?.items.length ?? 0) > 0;
}

/**
 * Get total item count
 */
export function getItemCount(cart: ApiCart | null): number {
  return cart?.itemCount ?? 0;
}

/**
 * Get subtotal
 */
export function getSubtotal(cart: ApiCart | null): number {
  return cart?.subtotal ?? 0;
}

/**
 * Check if variant is in cart
 */
export function isVariantInCart(cart: ApiCart | null, variantId: string): boolean {
  return cart?.items.some((item) => item.variant.id === variantId) ?? false;
}

/**
 * Get quantity of variant in cart
 */
export function getVariantQuantity(cart: ApiCart | null, variantId: string): number {
  return cart?.items.find((item) => item.variant.id === variantId)?.quantity ?? 0;
}
