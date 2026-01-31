/**
 * Cart Feature - Barrel Export
 * 
 * This feature handles all shopping cart functionality:
 * - Cart state management (Zustand store)
 * - Cart UI components
 * - Cart utility functions
 * 
 * @example
 * // Using the cart store
 * import { useCartStore, useCartTotals, useCartItemCount } from '@/features/cart';
 * 
 * // Using cart components
 * import { CartList, CartSummary, CartInitializer } from '@/features/cart';
 */

// Store exports
export {
    useCartItemCount, useCartStore,
    useCartTotals
} from './store';

// Component exports
export {
    CartEmpty, CartInitializer, CartItem, CartList, CartSummary
} from './components';

// Type exports
export type {
    AddToCartParams, CartItem as CartItemType,
    CartState,
    CartTotals
} from './types/cart.types';

export { CART_STORAGE_KEY, CART_VERSION } from './types/cart.types';

// Utility exports
export {
    calculateCartTotals, createCartItem,
    findCartItemByVariant, generateCartItemId, validateQuantity
} from './utils/cart-helpers';

