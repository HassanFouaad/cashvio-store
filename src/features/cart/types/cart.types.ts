/**
 * Cart-related types for storefront
 * Following application patterns for type definitions
 */

import { PublicProductDto, PublicProductVariantDto, PublicProductImageDto } from '@/features/products/types/product.types';

/**
 * Represents a single item in the cart
 */
export interface CartItem {
  /** Unique identifier for the cart item */
  id: string;
  /** Product ID */
  productId: string;
  /** Product name (cached for display when product might not be available) */
  productName: string;
  /** Selected variant ID */
  variantId: string;
  /** Variant name (cached for display) */
  variantName: string;
  /** Variant SKU */
  sku: string;
  /** Quantity of this item */
  quantity: number;
  /** Unit price at the time of adding to cart */
  unitPrice: number;
  /** Primary product image (cached) */
  imageUrl?: string;
  /** Maximum available quantity for validation */
  maxQuantity: number;
  /** Whether the item is still in stock */
  inStock: boolean;
  /** Timestamp when item was added */
  addedAt: string;
}

/**
 * Cart state stored in localStorage
 */
export interface CartState {
  /** Array of cart items */
  items: CartItem[];
  /** Store ID this cart belongs to */
  storeId: string;
  /** Currency code for price display */
  currency: string;
  /** Last updated timestamp */
  updatedAt: string;
  /** Cart version for migration purposes */
  version: number;
}

/**
 * Cart totals calculated from items
 */
export interface CartTotals {
  /** Total number of items in cart */
  itemCount: number;
  /** Total number of unique products */
  uniqueItems: number;
  /** Subtotal before any discounts or taxes */
  subtotal: number;
  /** Tax amount (if applicable) */
  tax: number;
  /** Total amount */
  total: number;
}

/**
 * Parameters for adding item to cart
 */
export interface AddToCartParams {
  product: PublicProductDto;
  variant: PublicProductVariantDto;
  quantity: number;
  currency: string;
  storeId: string;
}

/**
 * Parameters for updating cart item quantity
 */
export interface UpdateCartItemParams {
  itemId: string;
  quantity: number;
}

/**
 * Cart context value exposed to components
 */
export interface CartContextValue {
  /** Current cart state */
  cart: CartState | null;
  /** Whether cart is loading from storage */
  isLoading: boolean;
  /** Cart totals */
  totals: CartTotals;
  /** Add item to cart */
  addItem: (params: AddToCartParams) => void;
  /** Remove item from cart */
  removeItem: (itemId: string) => void;
  /** Update item quantity */
  updateQuantity: (params: UpdateCartItemParams) => void;
  /** Clear entire cart */
  clearCart: () => void;
  /** Check if a specific variant is in cart */
  isInCart: (variantId: string) => boolean;
  /** Get quantity of a specific variant in cart */
  getItemQuantity: (variantId: string) => number;
}

/**
 * Cart storage key prefix
 */
export const CART_STORAGE_KEY = 'sf_cart';

/**
 * Current cart version for migrations
 */
export const CART_VERSION = 1;
