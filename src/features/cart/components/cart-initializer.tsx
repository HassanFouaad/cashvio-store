'use client';

import { useCartStore } from '@/features/cart/store';
import { useEffect } from 'react';

interface CartInitializerProps {
  /** Store currency — enables correct analytics revenue attribution */
  currency: string;
}

/**
 * Cart initializer component
 * Fetches cart from API on mount and seeds the store currency
 * Should be placed in the root layout
 */
export function CartInitializer({ currency }: CartInitializerProps) {
  const { fetchCart, isInitialized, setCurrency } = useCartStore();

  useEffect(() => {
    setCurrency(currency);
  }, [currency, setCurrency]);

  useEffect(() => {
    if (!isInitialized) {
      fetchCart();
    }
  }, [fetchCart, isInitialized]);

  return null;
}
