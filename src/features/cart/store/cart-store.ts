/**
 * Cart Zustand Store
 * Global state management for shopping cart
 * Persists to localStorage and works with SSR
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CartState,
  CartItem,
  CartTotals,
  AddToCartParams,
  CART_STORAGE_KEY,
  CART_VERSION,
} from '../types/cart.types';
import {
  createCartItem,
  findCartItemByVariant,
  calculateCartTotals,
  validateQuantity,
} from '../utils/cart-helpers';

interface CartStore {
  // State
  items: CartItem[];
  storeId: string | null;
  currency: string;
  updatedAt: string;
  isHydrated: boolean;
  
  // Computed
  getTotals: () => CartTotals;
  
  // Actions
  initializeStore: (storeId: string, currency: string) => void;
  addItem: (params: AddToCartParams) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (variantId: string) => boolean;
  getItemQuantity: (variantId: string) => number;
  setHydrated: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      storeId: null,
      currency: 'USD',
      updatedAt: new Date().toISOString(),
      isHydrated: false,

      // Computed totals
      getTotals: () => calculateCartTotals(get().items),

      // Initialize store with storeId and currency
      initializeStore: (storeId: string, currency: string) => {
        const currentStoreId = get().storeId;
        
        // If switching stores, clear the cart
        if (currentStoreId && currentStoreId !== storeId) {
          set({
            items: [],
            storeId,
            currency,
            updatedAt: new Date().toISOString(),
          });
        } else if (!currentStoreId) {
          set({ storeId, currency });
        } else if (get().currency !== currency) {
          set({ currency });
        }
      },

      // Add item to cart
      addItem: (params: AddToCartParams) => {
        const { items } = get();
        const existingItem = findCartItemByVariant(items, params.variant.id);

        if (existingItem) {
          // Update existing item quantity
          const newQuantity = validateQuantity(
            existingItem.quantity + params.quantity,
            params.variant.availableQuantity
          );

          set({
            items: items.map((item) =>
              item.id === existingItem.id
                ? { ...item, quantity: newQuantity, maxQuantity: params.variant.availableQuantity }
                : item
            ),
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Add new item
          const newItem = createCartItem(params);
          set({
            items: [...items, newItem],
            storeId: params.storeId,
            currency: params.currency,
            updatedAt: new Date().toISOString(),
          });
        }
      },

      // Remove item from cart
      removeItem: (itemId: string) => {
        set({
          items: get().items.filter((item) => item.id !== itemId),
          updatedAt: new Date().toISOString(),
        });
      },

      // Update item quantity
      updateQuantity: (itemId: string, quantity: number) => {
        const { items } = get();
        const item = items.find((i) => i.id === itemId);

        if (!item) return;

        const validatedQuantity = validateQuantity(quantity, item.maxQuantity);

        if (validatedQuantity === 0) {
          set({
            items: items.filter((i) => i.id !== itemId),
            updatedAt: new Date().toISOString(),
          });
        } else {
          set({
            items: items.map((i) =>
              i.id === itemId ? { ...i, quantity: validatedQuantity } : i
            ),
            updatedAt: new Date().toISOString(),
          });
        }
      },

      // Clear entire cart
      clearCart: () => {
        set({
          items: [],
          updatedAt: new Date().toISOString(),
        });
      },

      // Check if variant is in cart
      isInCart: (variantId: string) => {
        return !!findCartItemByVariant(get().items, variantId);
      },

      // Get quantity of variant in cart
      getItemQuantity: (variantId: string) => {
        const item = findCartItemByVariant(get().items, variantId);
        return item?.quantity || 0;
      },

      // Set hydrated flag
      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: CART_VERSION,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      partialize: (state) => ({
        items: state.items,
        storeId: state.storeId,
        currency: state.currency,
        updatedAt: state.updatedAt,
      }),
    }
  )
);

/**
 * Hook to safely access cart totals (handles SSR)
 */
export function useCartTotals(): CartTotals {
  const items = useCartStore((state) => state.items);
  return calculateCartTotals(items);
}

/**
 * Hook to get cart item count (handles SSR)
 */
export function useCartItemCount(): number {
  const items = useCartStore((state) => state.items);
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
