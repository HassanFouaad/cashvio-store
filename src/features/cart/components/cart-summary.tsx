"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FulfillmentMethod } from "@/features/checkout/types/checkout.types";
import { CatalogueDiscountUtils } from "@/features/products/utils/catalogue-discount.utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import { useSharedCartPreview } from "./cart-preview-provider";
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
}

const METHOD_LABEL_KEY: Record<FulfillmentMethod, string> = {
  [FulfillmentMethod.DELIVERY]: "methods.delivery",
  [FulfillmentMethod.PICKUP]: "methods.pickup",
  [FulfillmentMethod.DINE_IN]: "methods.dine_in",
};

/**
 * Cart order summary — totals come from public order preview (same source
 * as checkout / POS ticket), not from local cart math.
 */
export function CartSummary({ currency, locale }: CartSummaryProps) {
  const t = useTranslations("cart");
  const tCheckout = useTranslations("checkout");
  const { cart, isInitialized, fetchCart } = useCartStore();
  const isSyncing = useIsCartSyncing();
  const pendingChangesCount = usePendingChangesCount();
  const canCheckout = useCanCheckout();

  const {
    preview,
    isPreviewLoading,
    previewError,
    fulfillmentMethod,
    availableMethods,
    setFulfillmentMethod,
  } = useSharedCartPreview();

  const validation = useMemo(() => computeCartValidation(cart), [cart]);

  if (!isInitialized) {
    return (
      <div className="p-4 sm:p-6 rounded-xl border bg-card space-y-4 animate-pulse">
        <div className="h-5 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-10 bg-muted rounded w-full" />
      </div>
    );
  }

  const itemCount = cart?.itemCount ?? 0;
  const hasPendingChanges = pendingChangesCount > 0;
  const showPreviewSkeleton =
    itemCount > 0 && (isPreviewLoading || (!preview && !previewError));

  const isBelowMinimum = preview?.isBelowMinimumOrder ?? false;
  const minimumOrderValue = preview?.minimumOrderValue ?? 0;
  const isFreeDeliveryApplied = preview?.isFreeDeliveryApplied ?? false;
  const freeDeliveryThreshold = preview?.freeDeliveryThreshold ?? 0;

  const merchandiseTotal = preview
    ? preview.subtotal - preview.totalDiscount + preview.totalTax
    : 0;
  const {
    catalogueDiscountTotal,
    additionalDiscountTotal,
    catalogueDiscountLabel,
  } = CatalogueDiscountUtils.getPreviewDiscountBreakdown(
    preview,
    t("catalogueDiscount"),
  );
  const remainingToFreeDelivery = Math.max(
    freeDeliveryThreshold - merchandiseTotal,
    0,
  );

  const handleRefreshCart = async () => {
    await fetchCart();
  };

  const renderAmount = (value: number, isNegative = false) =>
    showPreviewSkeleton ? (
      <Skeleton className="h-4 w-14" />
    ) : (
      <span
        className={`font-medium tabular-nums ${isNegative ? "text-success" : ""}`}
      >
        {isNegative && value > 0 ? "-" : ""}
        {formatCurrency(value, currency, locale)}
      </span>
    );

  return (
    <div className="p-4 sm:p-6 rounded-xl border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("orderSummary")}</h2>
        <span className="text-muted-foreground text-sm flex items-center gap-1">
          {(isSyncing || hasPendingChanges || isPreviewLoading) && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {t("itemCount", { count: itemCount })}
        </span>
      </div>

      {/* Fulfillment method — required for accurate preview fees */}
      {itemCount > 0 && availableMethods.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {availableMethods.map((method) => {
            const value = method.fulfillmentMethod;
            const isSelected = fulfillmentMethod === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFulfillmentMethod(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {tCheckout(METHOD_LABEL_KEY[value])}
              </button>
            );
          })}
        </div>
      )}

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

      {previewError && itemCount > 0 && (
        <div className="text-sm text-destructive">{t("previewError")}</div>
      )}

      {itemCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            {renderAmount(preview?.subtotal ?? 0)}
          </div>

          {preview && preview.totalTax > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("tax")}</span>
              {renderAmount(preview.totalTax)}
            </div>
          )}

          {preview && catalogueDiscountTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {catalogueDiscountLabel}
              </span>
              {renderAmount(catalogueDiscountTotal, true)}
            </div>
          )}

          {preview && additionalDiscountTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("discount")}</span>
              {renderAmount(additionalDiscountTotal, true)}
            </div>
          )}

          {preview && preview.serviceFees > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("serviceFees")}</span>
              {renderAmount(preview.serviceFees)}
            </div>
          )}

          {(fulfillmentMethod === FulfillmentMethod.DELIVERY ||
            (preview?.deliveryFees ?? 0) > 0 ||
            isFreeDeliveryApplied) && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("deliveryFees")}</span>
              {showPreviewSkeleton ? (
                <Skeleton className="h-4 w-14" />
              ) : isFreeDeliveryApplied ? (
                <span className="font-medium text-success">{t("free")}</span>
              ) : (
                renderAmount(preview?.deliveryFees ?? 0)
              )}
            </div>
          )}
          {isFreeDeliveryApplied && !showPreviewSkeleton && (
            <div className="p-3 rounded-lg border border-border">
              <p className="text-sm font-medium text-success">
                {t("freeDeliveryApplied", {
                  threshold: formatCurrency(
                    freeDeliveryThreshold,
                    currency,
                    locale,
                  ),
                })}
              </p>
            </div>
          )}

          {fulfillmentMethod === FulfillmentMethod.DELIVERY &&
            !isFreeDeliveryApplied &&
            freeDeliveryThreshold > 0 &&
            (preview?.deliveryFees ?? 0) > 0 &&
            !showPreviewSkeleton && (
              <p className="text-xs text-primary">
                {t("freeDeliveryNudge", {
                  amount: formatCurrency(
                    remainingToFreeDelivery,
                    currency,
                    locale,
                  ),
                })}
              </p>
            )}

          {isBelowMinimum && !showPreviewSkeleton && (
            <div className="p-3 rounded-lg border border-warning/40 bg-warning/5">
              <p className="text-sm font-medium">
                {t("belowMinimumOrder", {
                  minimumOrderValue: formatCurrency(
                    minimumOrderValue,
                    currency,
                    locale,
                  ),
                })}
              </p>
            </div>
          )}

          <hr className="border-border" />
          <div className="flex items-center justify-between font-semibold text-base pt-1">
            <span>{t("total")}</span>
            {showPreviewSkeleton ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <span className="tabular-nums">
                {formatCurrency(preview?.totalAmount ?? 0, currency, locale)}
              </span>
            )}
          </div>
        </div>
      )}

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
      ) : canCheckout && !isBelowMinimum && preview && !previewError ? (
        <Link href="/checkout" className="w-full">
          <Button className="w-full">
            {hasPendingChanges || isPreviewLoading ? (
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
          {showPreviewSkeleton ? t("calculating") : t("proceedToCheckout")}
        </Button>
      )}
    </div>
  );
}
