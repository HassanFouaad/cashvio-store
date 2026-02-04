/**
 * Cart API service
 * 
 * API calls return void - cart refresh is handled separately by the store
 */

import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { ApiException } from '@/lib/api/types';
import { ApiCart, ModifyCartItemRequest } from './cart.types';

/**
 * Get cart for visitor
 */
export async function getCart(visitorId: string): Promise<ApiCart | null> {
  try {
    const cart = await apiClient.get<ApiCart | null>(
      endpoints.carts.get(visitorId)
    );
    return cart;
  } catch (error) {
    if (error instanceof ApiException && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Modify cart item (add, update, remove)
 * - quantity > 0: add or update item
 * - quantity = 0 or omitted: remove item
 * 
 * Returns void - cart should be refetched separately
 */
export async function modifyCartItem(
  request: ModifyCartItemRequest
): Promise<void> {
  try {
    await apiClient.post<void, ModifyCartItemRequest>(
      endpoints.carts.modifyItem,
      request
    );
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, 'Failed to modify cart');
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  visitorId: string,
  variantId: string,
  quantity: number
): Promise<void> {
  return modifyCartItem({ visitorId, variantId, quantity });
}

/**
 * Update item quantity
 */
export async function updateCartItemQuantity(
  visitorId: string,
  variantId: string,
  quantity: number
): Promise<void> {
  return modifyCartItem({ visitorId, variantId, quantity });
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  visitorId: string,
  variantId: string
): Promise<void> {
  return modifyCartItem({ visitorId, variantId, quantity: 0 });
}

/**
 * Clear all items from cart
 * Backend doesn't have dedicated endpoint, so we remove items in parallel
 */
export async function clearCart(visitorId: string, variantIds: string[]): Promise<void> {
  if (variantIds.length === 0) return;

  // Remove all items in parallel for better performance
  await Promise.all(
    variantIds.map(variantId => removeFromCart(visitorId, variantId))
  );
}
