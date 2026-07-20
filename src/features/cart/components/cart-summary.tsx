"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatters";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import {
  computeCartValidation,
  useCanCheckout,
  useCartStore,
  useIsCartSyncing,
  usePendingChangesCount,
} from "../store";

interface CartSummaryProps {
  currency: string;
  locale: string;
  /** Store's minimum order value (0 = no minimum, nudge hidden) */
  minimumOrderValue?: number;
  /** Subtotal at which delivery becomes free (0 = disabled, nudge hidden) */
  freeDeliveryThreshold?: number;
}

/**
 * Cart summary component
 * Displays subtotal, item count, validation warnings, minimum-order and
 * free-delivery progress nudges, and checkout button
 */
export function CartSummary({
  currency,
  locale,
  minimumOrderValue = 0,
  freeDeliveryThreshold = 0,
}: CartSummaryProps) {
  const t = useTranslations("cart");
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

  // Minimum-order nudge: only when a minimum is configured and the cart
  // has items but hasn't reached it yet. Checkout preview re-validates
  // server-side — this is a UX nudge, not the enforcement point.
  const isBelowMinimum =
    minimumOrderValue > 0 && itemCount > 0 && subtotal < minimumOrderValue;
  const remainingToMinimum = Math.max(minimumOrderValue - subtotal, 0);
  const minimumProgress =
    minimumOrderValue > 0
      ? Math.min(Math.round((subtotal / minimumOrderValue) * 100), 100)
      : 100;

  // Free-delivery nudge: incentive (not a blocker) — checkout computes the
  // actual fee waiver server-side, this only previews the progress
  const hasFreeDeliveryThreshold = freeDeliveryThreshold > 0 && itemCount > 0;
  const hasReachedFreeDelivery =
    hasFreeDeliveryThreshold && subtotal >= freeDeliveryThreshold;
  const remainingToFreeDelivery = Math.max(freeDeliveryThreshold - subtotal, 0);
  const freeDeliveryProgress =
    freeDeliveryThreshold > 0
      ? Math.min(Math.round((subtotal / freeDeliveryThreshold) * 100), 100)
      : 100;

  const handleRefreshCart = async () => {
    await fetchCart();
  };

  return (
    <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("orderSummary")}</h2>
        <span className="text-muted-foreground text-sm flex items-center gap-1">
          {(isSyncing || hasPendingChanges) && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {t("itemCount", { count: itemCount })}
        </span>
      </div>

      {/* Stock Issues Warning */}
      {validation.hasStockIssues && (
        <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                {t("cartChangedTitle")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("cartChangedDescription")}
              </p>
              {validation.itemsWithIssues.length > 0 && (
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  {validation.itemsWithIssues.slice(0, 3).map((item) => (
                    <li key={item.variantId}>
                      • {item.productName}:{" "}
                      {item.available === 0
                        ? t("outOfStock")
                        : item.available < 5
                          ? t("quantityExceeded", {
                              available: item.available,
                            })
                          : t("quantityExceededGeneric")}
                    </li>
                  ))}
                  {validation.itemsWithIssues.length > 3 && (
                    <li>
                      •{" "}
                      {t("moreItems", {
                        count: validation.itemsWithIssues.length - 3,
                      })}
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Minimum order progress nudge */}
      {isBelowMinimum && (
        <div className="p-3 rounded-lg border border-amber-300/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 space-y-2">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t("minimumOrderNudge", {
              amount: formatCurrency(remainingToMinimum, currency, locale),
            })}
          </p>
          <div
            className="h-2 w-full rounded-full bg-amber-200/60 dark:bg-amber-500/20 overflow-hidden"
            role="progressbar"
            aria-valuenow={minimumProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("minimumOrderProgress", {
              minimum: formatCurrency(minimumOrderValue, currency, locale),
            })}
          >
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${minimumProgress}%` }}
            />
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t("minimumOrderProgress", {
              minimum: formatCurrency(minimumOrderValue, currency, locale),
            })}
          </p>
        </div>
      )}

      {/* Free-delivery progress nudge (incentive, never blocks checkout) */}
      {hasFreeDeliveryThreshold &&
        (hasReachedFreeDelivery ? (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
            <p className="text-sm font-medium text-primary">
              {t("freeDeliveryReached")}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
            <p className="text-sm font-medium text-primary">
              {t("freeDeliveryNudge", {
                amount: formatCurrency(
                  remainingToFreeDelivery,
                  currency,
                  locale,
                ),
              })}
            </p>
            <div
              className="h-2 w-full rounded-full bg-primary/15 overflow-hidden"
              role="progressbar"
              aria-valuenow={freeDeliveryProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("freeDeliveryProgress", {
                threshold: formatCurrency(
                  freeDeliveryThreshold,
                  currency,
                  locale,
                ),
              })}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
            <p className="text-xs text-primary/80">
              {t("freeDeliveryProgress", {
                threshold: formatCurrency(
                  freeDeliveryThreshold,
                  currency,
                  locale,
                ),
              })}
            </p>
          </div>
        ))}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span className="font-medium">
            {formatCurrency(subtotal, currency, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("shipping")}</span>
          <span className="italic">
            {hasReachedFreeDelivery ? t("shippingFree") : t("calculatedAtCheckout")}
          </span>
        </div>
        <hr className="border-border" />
        <div className="flex items-center justify-between font-bold text-base pt-1">
          <span>{t("total")}</span>
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
              {t("validatingCart")}
            </>
          ) : (
            t("reviewChanges")
          )}
        </Button>
      ) : canCheckout && !isBelowMinimum ? (
        <Link href="/checkout" className="w-full">
          <Button className="w-full">
            {hasPendingChanges ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t("syncing")}
              </>
            ) : (
              t("proceedToCheckout")
            )}
          </Button>
        </Link>
      ) : (
        <Button className="w-full" disabled>
          {t("proceedToCheckout")}
        </Button>
      )}
    </div>
  );
}
