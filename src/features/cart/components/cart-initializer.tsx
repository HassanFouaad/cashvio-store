'use client';

import { useEffect } from 'react';
import { useCartStore } from '../store';

interface CartInitializerProps {
  storeId: string;
  currency: string;
}

/**
 * Client component that initializes the cart store
 * Renders nothing - just initializes state
 * Keeps the layout SSR-friendly
 */
export function CartInitializer({ storeId, currency }: CartInitializerProps) {
  const initializeStore = useCartStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore(storeId, currency);
  }, [storeId, currency, initializeStore]);

  return null;
}
