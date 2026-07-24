/**
 * Cart Zustand Store
 * 
 * Features:
 * - Optimistic updates for instant UI response
 * - Debounced API calls to prevent overwhelming the backend
 * - Automatic cart refresh after modifications
 * - Error handling with rollback
 * - Line identity = variant + modifier selection (same variant with a
 *   different add-on set is its own line, addressed by line id)
 */

import { analytics } from '@/lib/analytics';
import { create } from 'zustand';
import {
    addToCart as apiAddToCart,
    clearCart as apiClearCart,
    getCart as apiGetCart,
    removeFromCart as apiRemoveFromCart,
    updateCartItemQuantity as apiUpdateQuantity,
} from '../api/cart.service';
import { ApiCart, ApiCartItem, ApiCartItemModifier } from '../api/cart.types';
import { getOrCreateVisitorId } from '@/lib/visitor/visitor-id';

// Debounce delay in ms
const DEBOUNCE_DELAY = 300;

// Map to track pending operations per cart line
const pendingOperations = new Map<string, NodeJS.Timeout>();

/** Stable identity of a modifier selection: sorted unique ids joined */
export function getModifierSignature(modifierIds?: string[] | null): string {
  if (!modifierIds || modifierIds.length === 0) return '';
  return [...new Set(modifierIds)].sort().join('|');
}

/** Selection key used before a server line id exists (adds) */
export function getSelectionKey(variantId: string, modifierIds?: string[]): string {
  return `${variantId}::${getModifierSignature(modifierIds)}`;
}

/** Modifier ids stored on a cart line */
function getLineModifierIds(item: ApiCartItem): string[] {
  return (item.modifiers ?? []).map((modifier) => modifier.modifierId);
}

/** Effective unit price of a line: variant price + modifier deltas */
export function getLineUnitPrice(item: ApiCartItem): number {
  const modifiersTotal = (item.modifiers ?? []).reduce(
    (sum, modifier) => sum + modifier.priceDelta,
    0
  );
  return item.variant.sellingPrice + modifiersTotal;
}

/** Find the line matching a variant + exact modifier selection */
function findLineBySelection(
  cart: ApiCart | null,
  variantId: string,
  modifierIds?: string[]
): ApiCartItem | undefined {
  if (!cart) return undefined;
  const signature = getModifierSignature(modifierIds);
  return cart.items.find(
    (item) =>
      item.variant.id === variantId &&
      getModifierSignature(getLineModifierIds(item)) === signature
  );
}

interface CartStore {
  // State
  cart: ApiCart | null;
  isLoading: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
  error: string | null;
  pendingChanges: Map<string, number>;
  /** Store currency — used for analytics revenue attribution */
  currency: string;

  // Actions
  setCurrency: (currency: string) => void;
  fetchCart: () => Promise<void>;
  addItem: (
    variantId: string,
    quantity: number,
    item?: Partial<ApiCartItem>,
    modifierIds?: string[]
  ) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => Promise<void>;
  clearError: () => void;

  // Helpers (variant-aggregated across lines)
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
 * Apply an optimistic quantity change to one line (by line id)
 */
function applyOptimisticLineUpdate(
  cart: ApiCart | null,
  itemId: string,
  quantity: number
): ApiCart | null {
  if (!cart) return null;

  const newItems =
    quantity === 0
      ? cart.items.filter((i) => i.id !== itemId)
      : cart.items.map((i) =>
          i.id === itemId
            ? { ...i, quantity, lineTotal: getLineUnitPrice(i) * quantity }
            : i
        );

  const { itemCount, subtotal } = calculateCartTotals(newItems);
  return { ...cart, items: newItems, itemCount, subtotal };
}

/**
 * Apply an optimistic add: merge into the matching selection line or append
 * a temp line until the server assigns a real id
 */
function applyOptimisticAdd(
  cart: ApiCart | null,
  variantId: string,
  quantity: number,
  item?: Partial<ApiCartItem>,
  modifierIds?: string[]
): ApiCart | null {
  if (!cart) return null;

  const existing = findLineBySelection(cart, variantId, modifierIds);
  let newItems: ApiCartItem[];

  if (existing) {
    newItems = cart.items.map((i) =>
      i.id === existing.id
        ? { ...i, quantity, lineTotal: getLineUnitPrice(i) * quantity }
        : i
    );
  } else if (item?.variant) {
    const newItem: ApiCartItem = {
      id: `temp-${getSelectionKey(variantId, modifierIds)}`,
      quantity,
      lineTotal: 0,
      variant: item.variant,
      productName: item.productName,
      imageUrl: item.imageUrl,
      modifiers: item.modifiers,
    };
    newItem.lineTotal = getLineUnitPrice(newItem) * quantity;
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
  currency: '',

  setCurrency: (currency: string) => {
    if (currency && currency !== get().currency) {
      set({ currency });
    }
  },

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

  addItem: (
    variantId: string,
    quantity: number,
    item?: Partial<ApiCartItem>,
    modifierIds?: string[]
  ) => {
    const { cart, pendingChanges } = get();
    const selectionKey = getSelectionKey(variantId, modifierIds);
    const existingLine = findLineBySelection(cart, variantId, modifierIds);
    const newQuantity = (existingLine?.quantity ?? 0) + quantity;

    // Track add_to_cart analytics event
    try {
      const modifiersTotal = (item?.modifiers ?? []).reduce(
        (sum: number, modifier: ApiCartItemModifier) => sum + modifier.priceDelta,
        0
      );
      const price = (item?.variant?.sellingPrice ?? 0) + modifiersTotal;
      analytics.trackAddToCart({
        currency: get().currency,
        value: price * quantity,
        items: [{
          item_id: variantId,
          item_name: item?.productName || '',
          price,
          quantity,
          item_variant: item?.variant?.name,
        }],
      });
    } catch { /* analytics should never break cart */ }

    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(selectionKey, newQuantity);
    const newCart = applyOptimisticAdd(cart, variantId, newQuantity, item, modifierIds);
    set({ pendingChanges: newPendingChanges, cart: newCart, error: null });

    const existingTimeout = pendingOperations.get(selectionKey);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeoutId = setTimeout(async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        await apiAddToCart(visitorId, variantId, newQuantity, modifierIds);
        
        const updatedPending = new Map(get().pendingChanges);
        updatedPending.delete(selectionKey);
        set({ pendingChanges: updatedPending });
        
        set({ isSyncing: true });
        const freshCart = await apiGetCart(visitorId);
        set({ cart: freshCart, isSyncing: false });
      } catch {
        const rollbackPending = new Map(get().pendingChanges);
        rollbackPending.delete(selectionKey);
        set({ pendingChanges: rollbackPending, error: 'Failed to add item', isSyncing: true });
        
        try {
          const visitorId = getOrCreateVisitorId();
          const freshCart = await apiGetCart(visitorId);
          set({ cart: freshCart });
        } catch { /* silent */ }
        set({ isSyncing: false });
      }
      pendingOperations.delete(selectionKey);
    }, DEBOUNCE_DELAY);

    pendingOperations.set(selectionKey, timeoutId);
  },

  updateQuantity: (itemId: string, quantity: number) => {
    const { cart, pendingChanges } = get();

    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(itemId, quantity);
    const newCart = applyOptimisticLineUpdate(cart, itemId, quantity);
    set({ pendingChanges: newPendingChanges, cart: newCart, error: null });

    const existingTimeout = pendingOperations.get(itemId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeoutId = setTimeout(async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        await apiUpdateQuantity(visitorId, itemId, quantity);
        
        const updatedPending = new Map(get().pendingChanges);
        updatedPending.delete(itemId);
        set({ pendingChanges: updatedPending });
        
        set({ isSyncing: true });
        const freshCart = await apiGetCart(visitorId);
        set({ cart: freshCart, isSyncing: false });
      } catch {
        const rollbackPending = new Map(get().pendingChanges);
        rollbackPending.delete(itemId);
        set({ pendingChanges: rollbackPending, error: 'Failed to update quantity', isSyncing: true });
        
        try {
          const visitorId = getOrCreateVisitorId();
          const freshCart = await apiGetCart(visitorId);
          set({ cart: freshCart });
        } catch { /* silent */ }
        set({ isSyncing: false });
      }
      pendingOperations.delete(itemId);
    }, DEBOUNCE_DELAY);

    pendingOperations.set(itemId, timeoutId);
  },

  removeItem: (itemId: string) => {
    const { cart, pendingChanges } = get();

    // Track remove_from_cart analytics event
    try {
      const existingItem = cart?.items.find(i => i.id === itemId);
      if (existingItem) {
        analytics.trackRemoveFromCart({
          currency: get().currency,
          value: existingItem.lineTotal,
          items: [{
            item_id: existingItem.variant.id,
            item_name: existingItem.productName || '',
            price: getLineUnitPrice(existingItem),
            quantity: existingItem.quantity,
            item_variant: existingItem.variant.name,
          }],
        });
      }
    } catch { /* analytics should never break cart */ }

    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(itemId, 0);
    const newCart = applyOptimisticLineUpdate(cart, itemId, 0);
    set({ pendingChanges: newPendingChanges, cart: newCart, error: null });

    const existingTimeout = pendingOperations.get(itemId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeoutId = setTimeout(async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        await apiRemoveFromCart(visitorId, itemId);
        
        const updatedPending = new Map(get().pendingChanges);
        updatedPending.delete(itemId);
        set({ pendingChanges: updatedPending });
        
        set({ isSyncing: true });
        const freshCart = await apiGetCart(visitorId);
        set({ cart: freshCart, isSyncing: false });
      } catch {
        const rollbackPending = new Map(get().pendingChanges);
        rollbackPending.delete(itemId);
        set({ pendingChanges: rollbackPending, error: 'Failed to remove item', isSyncing: true });
        
        try {
          const visitorId = getOrCreateVisitorId();
          const freshCart = await apiGetCart(visitorId);
          set({ cart: freshCart });
        } catch { /* silent */ }
        set({ isSyncing: false });
      }
      pendingOperations.delete(itemId);
    }, 100);

    pendingOperations.set(itemId, timeoutId);
  },

  clearCart: async () => {
    const { cart } = get();
    if (!cart || cart.items.length === 0) return;

    const previousCart = cart;
    const itemIds = cart.items.map(item => item.id);

    set({ cart: { ...cart, items: [], itemCount: 0, subtotal: 0 }, error: null });

    try {
      const visitorId = getOrCreateVisitorId();
      await apiClearCart(visitorId, itemIds);
      
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
    return (
      get().cart?.items.reduce(
        (sum, item) => (item.variant.id === variantId ? sum + item.quantity : sum),
        0
      ) ?? 0
    );
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

/** Hook to check if a specific cart line has pending changes */
export function useIsItemPending(item: ApiCartItem): boolean {
  const selectionKey = getSelectionKey(
    item.variant.id,
    getLineModifierIds(item)
  );
  return useCartStore(
    (state) =>
      state.pendingChanges.has(item.id) ||
      state.pendingChanges.has(selectionKey)
  );
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
 * Use with useMemo in components.
 * Stock limits apply to the combined quantity per variant — the same
 * variant may sit on several lines with different modifier selections.
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

  const requestedByVariant = new Map<
    string,
    { item: ApiCartItem; quantity: number }
  >();
  for (const item of cart.items) {
    const existing = requestedByVariant.get(item.variant.id);
    requestedByVariant.set(item.variant.id, {
      item,
      quantity: (existing?.quantity ?? 0) + item.quantity,
    });
  }

  for (const { item, quantity } of requestedByVariant.values()) {
    if (!item.variant.inStock && item.variant.inventoryTrackable) {
      hasOutOfStockItems = true;
      itemsWithIssues.push({
        variantId: item.variant.id,
        productName: item.productName || item.variant.name,
        requested: quantity,
        available: 0,
      });
    } else if (quantity > item.variant.availableQuantity && item.variant.inventoryTrackable) {
      itemsWithIssues.push({
        variantId: item.variant.id,
        productName: item.productName || item.variant.name,
        requested: quantity,
        available: item.variant.availableQuantity,
      });
    } else if (
      item.variant.maxQuantityPerOrder != null &&
      quantity > item.variant.maxQuantityPerOrder
    ) {
      itemsWithIssues.push({
        variantId: item.variant.id,
        productName: item.productName || item.variant.name,
        requested: quantity,
        available: item.variant.maxQuantityPerOrder,
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
 * Hook to check if cart can proceed to checkout (simple boolean)
 */
export function useCanCheckout(): boolean {
  const cart = useCartStore((state) => state.cart);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const pendingSize = useCartStore((state) => state.pendingChanges.size);
  
  if (!cart || cart.items.length === 0 || isSyncing || pendingSize > 0) {
    return false;
  }
  
  return computeCartValidation(cart).isValid;
}
