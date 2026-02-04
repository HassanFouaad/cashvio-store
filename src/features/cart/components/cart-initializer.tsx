'use client';

import { useCartStore } from '@/features/cart/store';
import { useEffect } from 'react';

/**
 * Cart initializer component
 * Fetches cart from API on mount
 * Should be placed in the root layout
 */
export function CartInitializer() {
  const { fetchCart, isInitialized } = useCartStore();

  useEffect(() => {
    if (!isInitialized) {
      fetchCart();
    }
  }, [fetchCart, isInitialized]);

  return null;
}
