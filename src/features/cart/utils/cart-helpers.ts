/**
 * Cart utility functions
 * Following application patterns for helper functions
 */

import { getPrimaryImage } from '@/features/products/utils/product-helpers';
import {
  AddToCartParams,
  CartItem,
  CartState,
  CartTotals,
  CART_STORAGE_KEY,
  CART_VERSION,
} from '../types/cart.types';

/**
 * Generate unique cart item ID
 */
export function generateCartItemId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get cart storage key for a specific store
 */
export function getCartStorageKey(storeId: string): string {
  return `${CART_STORAGE_KEY}_${storeId}`;
}

/**
 * Load cart from localStorage
 */
export function loadCartFromStorage(storeId: string): CartState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const key = getCartStorageKey(storeId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    const cart = JSON.parse(stored) as CartState;
    
    // Validate cart version and store ID
    if (cart.version !== CART_VERSION || cart.storeId !== storeId) {
      // Clear invalid cart
      localStorage.removeItem(key);
      return null;
    }

    return cart;
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return null;
  }
}

/**
 * Save cart to localStorage
 */
export function saveCartToStorage(cart: CartState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getCartStorageKey(cart.storeId);
    localStorage.setItem(key, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
}

/**
 * Clear cart from localStorage
 */
export function clearCartFromStorage(storeId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getCartStorageKey(storeId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cart from storage:', error);
  }
}

/**
 * Create an empty cart state
 */
export function createEmptyCart(storeId: string, currency: string): CartState {
  return {
    items: [],
    storeId,
    currency,
    updatedAt: new Date().toISOString(),
    version: CART_VERSION,
  };
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
 * Calculate cart totals
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
 * Validate cart item quantity
 */
export function validateQuantity(
  quantity: number,
  maxQuantity: number
): number {
  if (quantity < 1) return 1;
  if (quantity > maxQuantity) return maxQuantity;
  return quantity;
}

/**
 * Add or update item in cart
 */
export function addItemToCart(
  cart: CartState,
  params: AddToCartParams
): CartState {
  const existingItem = findCartItemByVariant(cart.items, params.variant.id);

  let newItems: CartItem[];

  if (existingItem) {
    // Update existing item quantity
    const newQuantity = validateQuantity(
      existingItem.quantity + params.quantity,
      params.variant.availableQuantity
    );

    newItems = cart.items.map((item) =>
      item.id === existingItem.id
        ? { ...item, quantity: newQuantity, maxQuantity: params.variant.availableQuantity }
        : item
    );
  } else {
    // Add new item
    const newItem = createCartItem(params);
    newItems = [...cart.items, newItem];
  }

  return {
    ...cart,
    items: newItems,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Remove item from cart
 */
export function removeItemFromCart(
  cart: CartState,
  itemId: string
): CartState {
  return {
    ...cart,
    items: cart.items.filter((item) => item.id !== itemId),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update item quantity in cart
 */
export function updateItemQuantity(
  cart: CartState,
  itemId: string,
  quantity: number
): CartState {
  const item = cart.items.find((i) => i.id === itemId);
  
  if (!item) {
    return cart;
  }

  const validatedQuantity = validateQuantity(quantity, item.maxQuantity);

  // Remove item if quantity is 0
  if (validatedQuantity === 0) {
    return removeItemFromCart(cart, itemId);
  }

  return {
    ...cart,
    items: cart.items.map((i) =>
      i.id === itemId ? { ...i, quantity: validatedQuantity } : i
    ),
    updatedAt: new Date().toISOString(),
  };
}
