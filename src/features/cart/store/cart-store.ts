/**
 * Cart Zustand Store
 * 
 * Features:
 * - Optimistic updates for instant UI response
 * - Debounced API calls to prevent overwhelming the backend
 * - Automatic cart refresh after modifications
 * - Error handling with rollback
 */

import { create } from 'zustand';
import {
  addToCart as apiAddToCart,
  clearCart as apiClearCart,
  getCart as apiGetCart,
  removeFromCart as apiRemoveFromCart,
  updateCartItemQuantity as apiUpdateQuantity,
} from '../api/cart.service';
import { ApiCart, ApiCartItem } from '../api/cart.types';
import { getOrCreateVisitorId } from '../types/cart.types';

// Debounce delay in ms
const DEBOUNCE_DELAY = 300;

// Map to track pending operations per variant
const pendingOperations = new Map<string, NodeJS.Timeout>();

interface CartStore {
  // State
  cart: ApiCart | null;
  isLoading: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
  error: string | null;
  pendingChanges: Map<string, number>;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity: number, item?: Partial<ApiCartItem>) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => Promise<void>;
  clearError: () => void;

  // Helpers
  isInCart: (variantId: string) => boolean;
  getItemQuantity: (variantId: string) => number;
}

/**
 * Calculate cart totals from items
 */
function calculateCartTotals(items: ApiCartItem[]): { itemCount: number; subtotal: number } {
  return items.reduce(
    (acc, item) => ({
      itemCount: acc.itemCount + item.quantity,
      subtotal: acc.subtotal + item.lineTotal,
    }),
    { itemCount: 0, subtotal: 0 }
  );
}

/**
 * Apply optimistic update to cart
 */
function applyOptimisticUpdate(
  cart: ApiCart | null,
  variantId: string,
  quantity: number,
  item?: Partial<ApiCartItem>
): ApiCart | null {
  if (!cart) return null;

  const existingItemIndex = cart.items.findIndex(i => i.variant.id === variantId);
  let newItems: ApiCartItem[];

  if (quantity === 0) {
    newItems = cart.items.filter(i => i.variant.id !== variantId);
  } else if (existingItemIndex >= 0) {
    newItems = cart.items.map((i, index) => {
      if (index === existingItemIndex) {
        return { ...i, quantity, lineTotal: i.variant.sellingPrice * quantity };
      }
      return i;
    });
  } else if (item?.variant) {
    const newItem: ApiCartItem = {
      id: `temp-${variantId}`,
      quantity,
      lineTotal: (item.variant.sellingPrice ?? 0) * quantity,
      variant: item.variant,
      productName: item.productName,
      imageUrl: item.imageUrl,
    };
    newItems = [...cart.items, newItem];
  } else {
    return cart;
  }

  const { itemCount, subtotal } = calculateCartTotals(newItems);
  return { ...cart, items: newItems, itemCount, subtotal };
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  isLoading: false,
  isInitialized: false,
  isSyncing: false,
  error: null,
  pendingChanges: new Map(),

  fetchCart: async () => {
    if (get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const visitorId = getOrCreateVisitorId();
      const cart = await apiGetCart(visitorId);
      set({ cart, isInitialized: true });
    } catch {
      set({ error: 'Failed to load cart', isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: (variantId: string, quantity: number, item?: Partial<ApiCartItem>) => {
    const { cart, pendingChanges } = get();
    const currentQuantity = get().getItemQuantity(variantId);
    const newQuantity = currentQuantity + quantity;

    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(variantId, newQuantity);
    const newCart = applyOptimisticUpdate(cart, variantId, newQuantity, item);
    set({ pendingChanges: newPendingChanges, cart: newCart, error: null });

    const existingTimeout = pendingOperations.get(variantId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeoutId = setTimeout(async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        await apiAddToCart(visitorId, variantId, newQuantity);
        
        const updatedPending = new Map(get().pendingChanges);
        updatedPending.delete(variantId);
        set({ pendingChanges: updatedPending });
        
        set({ isSyncing: true });
        const freshCart = await apiGetCart(visitorId);
        set({ cart: freshCart, isSyncing: false });
      } catch {
        const rollbackPending = new Map(get().pendingChanges);
        rollbackPending.delete(variantId);
        set({ pendingChanges: rollbackPending, error: 'Failed to add item', isSyncing: true });
        
        try {
          const visitorId = getOrCreateVisitorId();
          const freshCart = await apiGetCart(visitorId);
          set({ cart: freshCart });
        } catch { /* silent */ }
        set({ isSyncing: false });
      }
      pendingOperations.delete(variantId);
    }, DEBOUNCE_DELAY);

    pendingOperations.set(variantId, timeoutId);
  },

  updateQuantity: (variantId: string, quantity: number) => {
    const { cart, pendingChanges } = get();

    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(variantId, quantity);
    const newCart = applyOptimisticUpdate(cart, variantId, quantity);
    set({ pendingChanges: newPendingChanges, cart: newCart, error: null });

    const existingTimeout = pendingOperations.get(variantId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeoutId = setTimeout(async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        await apiUpdateQuantity(visitorId, variantId, quantity);
        
        const updatedPending = new Map(get().pendingChanges);
        updatedPending.delete(variantId);
        set({ pendingChanges: updatedPending });
        
        set({ isSyncing: true });
        const freshCart = await apiGetCart(visitorId);
        set({ cart: freshCart, isSyncing: false });
      } catch {
        const rollbackPending = new Map(get().pendingChanges);
        rollbackPending.delete(variantId);
        set({ pendingChanges: rollbackPending, error: 'Failed to update quantity', isSyncing: true });
        
        try {
          const visitorId = getOrCreateVisitorId();
          const freshCart = await apiGetCart(visitorId);
          set({ cart: freshCart });
        } catch { /* silent */ }
        set({ isSyncing: false });
      }
      pendingOperations.delete(variantId);
    }, DEBOUNCE_DELAY);

    pendingOperations.set(variantId, timeoutId);
  },

  removeItem: (variantId: string) => {
    const { cart, pendingChanges } = get();

    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(variantId, 0);
    const newCart = applyOptimisticUpdate(cart, variantId, 0);
    set({ pendingChanges: newPendingChanges, cart: newCart, error: null });

    const existingTimeout = pendingOperations.get(variantId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeoutId = setTimeout(async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        await apiRemoveFromCart(visitorId, variantId);
        
        const updatedPending = new Map(get().pendingChanges);
        updatedPending.delete(variantId);
        set({ pendingChanges: updatedPending });
        
        set({ isSyncing: true });
        const freshCart = await apiGetCart(visitorId);
        set({ cart: freshCart, isSyncing: false });
      } catch {
        const rollbackPending = new Map(get().pendingChanges);
        rollbackPending.delete(variantId);
        set({ pendingChanges: rollbackPending, error: 'Failed to remove item', isSyncing: true });
        
        try {
          const visitorId = getOrCreateVisitorId();
          const freshCart = await apiGetCart(visitorId);
          set({ cart: freshCart });
        } catch { /* silent */ }
        set({ isSyncing: false });
      }
      pendingOperations.delete(variantId);
    }, 100);

    pendingOperations.set(variantId, timeoutId);
  },

  clearCart: async () => {
    const { cart } = get();
    if (!cart || cart.items.length === 0) return;

    const previousCart = cart;
    const variantIds = cart.items.map(item => item.variant.id);

    set({ cart: { ...cart, items: [], itemCount: 0, subtotal: 0 }, error: null });

    try {
      const visitorId = getOrCreateVisitorId();
      await apiClearCart(visitorId, variantIds);
      
      set({ isSyncing: true });
      const freshCart = await apiGetCart(visitorId);
      set({ cart: freshCart, isSyncing: false });
    } catch {
      set({ cart: previousCart, error: 'Failed to clear cart' });
    }
  },

  clearError: () => set({ error: null }),

  isInCart: (variantId: string) => {
    return get().cart?.items.some((item) => item.variant.id === variantId) ?? false;
  },

  getItemQuantity: (variantId: string) => {
    return get().cart?.items.find((item) => item.variant.id === variantId)?.quantity ?? 0;
  },
}));

// ============================================
// SIMPLE PRIMITIVE HOOKS - No infinite loops
// ============================================

/** Hook to get cart item count */
export function useCartItemCount(): number {
  return useCartStore((state) => state.cart?.itemCount ?? 0);
}

/** Hook to get cart subtotal */
export function useCartSubtotal(): number {
  return useCartStore((state) => state.cart?.subtotal ?? 0);
}

/** Hook to check if cart is syncing */
export function useIsCartSyncing(): boolean {
  return useCartStore((state) => state.isSyncing);
}

/** Hook to check if a specific item has pending changes */
export function useIsItemPending(variantId: string): boolean {
  return useCartStore((state) => state.pendingChanges.has(variantId));
}

/** Hook to get pending changes count */
export function usePendingChangesCount(): number {
  return useCartStore((state) => state.pendingChanges.size);
}

// ============================================
// CART VALIDATION - Use outside of components
// ============================================

export interface CartValidationResult {
  isValid: boolean;
  hasStockIssues: boolean;
  hasOutOfStockItems: boolean;
  itemsWithIssues: Array<{
    variantId: string;
    productName: string;
    requested: number;
    available: number;
  }>;
}

/**
 * Compute cart validation - call this outside of render
 * Use with useMemo in components
 */
export function computeCartValidation(cart: ApiCart | null): CartValidationResult {
  if (!cart || cart.items.length === 0) {
    return {
      isValid: true,
      hasStockIssues: false,
      hasOutOfStockItems: false,
      itemsWithIssues: [],
    };
  }

  const itemsWithIssues: CartValidationResult['itemsWithIssues'] = [];
  let hasOutOfStockItems = false;

  for (const item of cart.items) {
    if (!item.variant.inStock && item.variant.inventoryTrackable) {
      hasOutOfStockItems = true;
      itemsWithIssues.push({
        variantId: item.variant.id,
        productName: item.productName || item.variant.name,
        requested: item.quantity,
        available: 0,
      });
    } else if (item.quantity > item.variant.availableQuantity && item.variant.inventoryTrackable) {
      itemsWithIssues.push({
        variantId: item.variant.id,
        productName: item.productName || item.variant.name,
        requested: item.quantity,
        available: item.variant.availableQuantity,
      });
    }
  }

  return {
    isValid: itemsWithIssues.length === 0,
    hasStockIssues: itemsWithIssues.length > 0,
    hasOutOfStockItems,
    itemsWithIssues,
  };
}

/**
 * Hook to check if cart has validation issues (simple boolean)
 */
export function useCartHasStockIssues(): boolean {
  const cart = useCartStore((state) => state.cart);
  if (!cart || cart.items.length === 0) return false;
  
  return cart.items.some(item => 
 ( (item.variant.inventoryTrackable) && (!item.variant.inStock || item.quantity > item.variant.availableQuantity))
  );
}

/**
 * Hook to check if cart can proceed to checkout (simple boolean)
 */
export function useCanCheckout(): boolean {
  const cart = useCartStore((state) => state.cart);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const pendingSize = useCartStore((state) => state.pendingChanges.size);
  
  if (!cart || cart.items.length === 0 || isSyncing || pendingSize > 0) {
    return false;
  }
  
  // Check for stock issues
  return !cart.items.some(item => 
    (item.variant.inventoryTrackable) && (!item.variant.inStock || item.quantity > item.variant.availableQuantity)
  );
}
