'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCartStore, useIsCartSyncing } from '../store';
import { CartEmpty } from './cart-empty';
import { CartItem } from './cart-item';

interface CartListProps {
  currency: string;
  locale: string;
}

/**
 * Cart items list component
 * Displays all items in cart or empty state
 */
export function CartList({ currency, locale }: CartListProps) {
  const t = useTranslations('cart');
  const { cart, clearCart, isInitialized, isLoading } = useCartStore();
  const isSyncing = useIsCartSyncing();

  // Show loading skeleton while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 py-4 animate-pulse">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div className="space-y-4">
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {t('yourCart')} ({cart.itemCount})
          {isSyncing && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </h2>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={clearCart}
        >
          <Trash2 className="h-4 w-4 me-2" />
          {t('clearAll')}
        </Button>
      </div>

      {/* Cart Items */}
      <div className="divide-y">
        {cart.items.map((item) => (
          <CartItem
            key={item.variant.id}
            item={item}
            currency={currency}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
