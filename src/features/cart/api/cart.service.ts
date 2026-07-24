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
 * Add item to cart (or set the quantity of the line with the exact same
 * variant + modifier selection)
 */
export async function addToCart(
  visitorId: string,
  variantId: string,
  quantity: number,
  modifierIds?: string[]
): Promise<void> {
  return modifyCartItem({
    visitorId,
    variantId,
    quantity,
    ...(modifierIds && modifierIds.length > 0 ? { modifierIds } : {}),
  });
}

/**
 * Update a cart line's quantity by its line id
 */
export async function updateCartItemQuantity(
  visitorId: string,
  itemId: string,
  quantity: number
): Promise<void> {
  return modifyCartItem({ visitorId, itemId, quantity });
}

/**
 * Remove a cart line by its line id
 */
export async function removeFromCart(
  visitorId: string,
  itemId: string
): Promise<void> {
  return modifyCartItem({ visitorId, itemId, quantity: 0 });
}

/**
 * Clear all items from cart
 * Backend doesn't have dedicated endpoint, so we remove items in parallel
 */
export async function clearCart(visitorId: string, itemIds: string[]): Promise<void> {
  if (itemIds.length === 0) return;

  // Remove all items in parallel for better performance
  await Promise.all(
    itemIds.map(itemId => removeFromCart(visitorId, itemId))
  );
}
