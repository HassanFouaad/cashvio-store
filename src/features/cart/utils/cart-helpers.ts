/**
 * Cart utility functions
 * Pure functions for cart logic - used by Zustand store
 */

import { getPrimaryImage } from '@/features/products/utils/product-helpers';
import { AddToCartParams, CartItem, CartTotals } from '../types/cart.types';

/**
 * Generate unique cart item ID
 */
export function generateCartItemId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a cart item from product and variant
 */
export function createCartItem(params: AddToCartParams): CartItem {
  const { product, variant, quantity } = params;
  const primaryImage = getPrimaryImage(product);

  return {
    id: generateCartItemId(),
    productId: product.id,
    productName: product.name,
    variantId: variant.id,
    variantName: variant.name,
    sku: variant.sku,
    quantity,
    unitPrice: variant.sellingPrice,
    imageUrl: primaryImage?.thumbnailUrl || primaryImage?.imageUrl,
    maxQuantity: variant.availableQuantity,
    inStock: variant.inStock,
    addedAt: new Date().toISOString(),
  };
}

/**
 * Find existing cart item by variant ID
 */
export function findCartItemByVariant(
  items: CartItem[],
  variantId: string
): CartItem | undefined {
  return items.find((item) => item.variantId === variantId);
}

/**
 * Calculate cart totals from items
 */
export function calculateCartTotals(items: CartItem[]): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = items.length;
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // Tax calculation would depend on business logic
  // For now, we assume prices are tax-inclusive
  const tax = 0;
  const total = subtotal + tax;

  return {
    itemCount,
    uniqueItems,
    subtotal,
    tax,
    total,
  };
}

/**
 * Validate cart item quantity within bounds
 */
export function validateQuantity(
  quantity: number,
  maxQuantity: number
): number {
  if (quantity < 0) return 0;
  if (quantity > maxQuantity) return maxQuantity;
  return Math.floor(quantity); // Ensure integer
}
