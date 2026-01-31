'use client';

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useCartStore, useCartTotals } from "@/features/cart/store";
import { formatCurrency } from "@/lib/utils/formatters";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface CartSummaryProps {
  currency: string;
  locale: string;
}

/**
 * Cart summary component
 * Displays totals and checkout button
 * Only renders when cart has items
 * Client component - requires cart state
 */
export function CartSummary({ currency, locale }: CartSummaryProps) {
  const t = useTranslations("cart");
  const items = useCartStore((state) => state.items);
  const isHydrated = useCartStore((state) => state.isHydrated);
  const totals = useCartTotals();

  // Don't render anything while hydrating or if cart is empty
  if (!isHydrated || items.length === 0) {
    return null;
  }

  // Check if any item is out of stock
  const hasOutOfStockItems = items.some((item) => !item.inStock);

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-muted/50 rounded-xl">
      <h2 className="text-lg font-semibold">{t("orderSummary")}</h2>

      <div className="space-y-2">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {t("subtotal")} ({totals.itemCount} {totals.itemCount === 1 ? t("item") : t("items")})
          </span>
          <span className="font-medium">
            {formatCurrency(totals.subtotal, currency, locale)}
          </span>
        </div>

        {/* Shipping - placeholder */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("shipping")}</span>
          <span className="font-medium text-green-600 dark:text-green-500">
            {t("calculatedAtCheckout")}
          </span>
        </div>

        {/* Tax if applicable */}
        {totals.tax > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("tax")}</span>
            <span className="font-medium">
              {formatCurrency(totals.tax, currency, locale)}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t pt-4">
        <div className="flex justify-between">
          <span className="text-base font-semibold">{t("total")}</span>
          <span className="text-lg font-bold">
            {formatCurrency(totals.total, currency, locale)}
          </span>
        </div>
      </div>

      {/* Out of stock warning */}
      {hasOutOfStockItems && (
        <p className="text-sm text-destructive">
          {t("someItemsOutOfStock")}
        </p>
      )}

      {/* Checkout Button */}
      <Link
        href="/checkout"
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full",
          hasOutOfStockItems && "pointer-events-none opacity-50"
        )}
        aria-disabled={hasOutOfStockItems}
      >
        {t("proceedToCheckout")}
      </Link>

      {/* Continue Shopping */}
      <Link 
        href="/products" 
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
      >
        {t("continueShopping")}
      </Link>
    </div>
  );
}
