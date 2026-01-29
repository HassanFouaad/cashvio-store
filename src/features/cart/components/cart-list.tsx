'use client';

import { useCartStore, useCartTotals } from "@/features/cart/store";
import { useTranslations } from "next-intl";
import { CartItem } from "./cart-item";
import { CartEmpty } from "./cart-empty";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface CartListProps {
  currency: string;
  locale: string;
}

/**
 * Cart items list component
 * Displays all items in cart or empty state
 * Client component - requires interactivity
 */
export function CartList({ currency, locale }: CartListProps) {
  const t = useTranslations("cart");
  const items = useCartStore((state) => state.items);
  const isHydrated = useCartStore((state) => state.isHydrated);
  const clearCart = useCartStore((state) => state.clearCart);
  const totals = useCartTotals();

  // Show loading skeleton while hydrating from localStorage
  if (!isHydrated) {
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

  if (items.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div className="space-y-4">
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t("yourCart")} ({totals.itemCount})
        </h2>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={clearCart}
        >
          <Trash2 className="h-4 w-4 me-2" />
          {t("clearAll")}
        </Button>
      </div>

      {/* Cart Items */}
      <div className="divide-y">
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            currency={currency}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
