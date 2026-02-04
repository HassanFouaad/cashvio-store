'use client';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/formatters';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';
import { computeCartValidation, useCanCheckout, useCartStore, useIsCartSyncing, usePendingChangesCount } from '../store';

interface CartSummaryProps {
  currency: string;
  locale: string;
}

/**
 * Cart summary component
 * Displays subtotal, item count, validation warnings, and checkout button
 */
export function CartSummary({ currency, locale }: CartSummaryProps) {
  const t = useTranslations('cart');
  const { cart, isInitialized, fetchCart } = useCartStore();
  const isSyncing = useIsCartSyncing();
  const pendingChangesCount = usePendingChangesCount();
  const canCheckout = useCanCheckout();

  // Compute validation with memoization to prevent recalculation
  const validation = useMemo(() => computeCartValidation(cart), [cart]);

  // Show loading skeleton while initializing
  if (!isInitialized) {
    return (
      <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4 animate-pulse">
        <div className="h-5 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-10 bg-muted rounded w-full" />
      </div>
    );
  }

  const itemCount = cart?.itemCount ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const hasPendingChanges = pendingChangesCount > 0;

  const handleRefreshCart = async () => {
    await fetchCart();
  };

  return (
    <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('orderSummary')}</h2>
        <span className="text-muted-foreground text-sm flex items-center gap-1">
          {(isSyncing || hasPendingChanges) && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {t('itemCount', { count: itemCount })}
        </span>
      </div>

      {/* Stock Issues Warning */}
      {validation.hasStockIssues && (
        <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                {t('cartChangedTitle')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('cartChangedDescription')}
              </p>
              {validation.itemsWithIssues.length > 0 && (
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  {validation.itemsWithIssues.slice(0, 3).map((item) => (
                    <li key={item.variantId}>
                      • {item.productName}: {item.available === 0 
                        ? t('outOfStock') 
                        : t('quantityExceeded', { available: item.available })}
                    </li>
                  ))}
                  {validation.itemsWithIssues.length > 3 && (
                    <li>• +{validation.itemsWithIssues.length - 3} more...</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>{t('subtotal')}</span>
          <span className="font-medium">
            {formatCurrency(subtotal, currency, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between font-bold text-base">
          <span>{t('total')}</span>
          <span>{formatCurrency(subtotal, currency, locale)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      {validation.hasStockIssues ? (
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handleRefreshCart}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {t('validatingCart')}
            </>
          ) : (
            t('reviewChanges')
          )}
        </Button>
      ) : canCheckout ? (
        <Link href="/checkout" className="w-full">
          <Button className="w-full">
            {hasPendingChanges ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('syncing')}
              </>
            ) : (
              t('proceedToCheckout')
            )}
          </Button>
        </Link>
      ) : (
        <Button className="w-full" disabled>
          {t('proceedToCheckout')}
        </Button>
      )}
    </div>
  );
}
