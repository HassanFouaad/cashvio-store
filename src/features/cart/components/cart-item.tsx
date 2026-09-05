"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/formatters";
import { AlertTriangle, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useMemo } from "react";
import { ApiCartItem } from "../api/cart.types";
import { OrderPreviewItem } from "@/features/checkout/types/checkout.types";
import { CatalogueDiscountUtils } from "@/features/products/utils/catalogue-discount.utils";
import { BundleUtils } from "@/features/products/utils/bundle.utils";
import { getLineUnitPrice, useCartStore, useIsItemPending } from "../store";

interface CartItemProps {
  item: ApiCartItem;
  currency: string;
  locale: string;
  previewItem?: OrderPreviewItem;
}

/**
 * Single cart item component
 * Displays product info, selected add-ons, quantity controls, and remove
 * button. Shows warnings when quantity exceeds available stock.
 */
export function CartItem({
  item,
  currency,
  locale,
  previewItem,
}: CartItemProps) {
  const t = useTranslations("cart");
  const tBundle = useTranslations("store.products.bundle");
  const { updateQuantity, removeItem } = useCartStore();
  const isPending = useIsItemPending(item);
  const { variant } = item;
  const modifiers = item.modifiers ?? [];
  const modifierTotal = modifiers.reduce(
    (sum, modifier) => sum + modifier.priceDelta,
    0,
  );
  const localUnitPrice = getLineUnitPrice(item);
  const hasCatalogueDiscount = CatalogueDiscountUtils.hasVariantDiscount(variant);
  const previewQuantity = previewItem?.quantity ?? 0;
  const isPreviewSynced =
    previewItem != null &&
    previewQuantity > 0 &&
    previewQuantity === item.quantity;
  const previewHasDiscount =
    isPreviewSynced && previewItem.lineDiscount > 0;
  const displayUnitPrice =
    isPreviewSynced
      ? (previewItem.lineSubtotal - previewItem.lineDiscount) / previewQuantity
      : localUnitPrice;
  const listUnitPrice =
    isPreviewSynced
      ? previewItem.lineSubtotal / previewQuantity
      : variant.originalSellingPrice != null
        ? variant.originalSellingPrice + modifierTotal
        : null;
  const hasDiscount = previewHasDiscount || hasCatalogueDiscount;
  const displayLineTotal =
    isPreviewSynced ? previewItem.lineTotal : item.lineTotal;

  // Non-trackable inventory products and unlimited bundles skip stock caps
  const isUnlimitedStock = BundleUtils.isUnlimitedStock(variant);

  // Max quantity per order (null = unlimited)
  const maxPerOrder = variant.maxQuantityPerOrder ?? null;

  // Check if quantity exceeds available stock (not applicable for unlimited stock)
  const quantityExceedsStock = useMemo(() => {
    if (isUnlimitedStock) return false;
    const available = variant.availableQuantity ?? 0;
    return item.quantity > available;
  }, [item.quantity, variant.availableQuantity, isUnlimitedStock]);

  // Check if quantity exceeds max per order
  const quantityExceedsMaxPerOrder = useMemo(() => {
    if (maxPerOrder === null) return false;
    return item.quantity > maxPerOrder;
  }, [item.quantity, maxPerOrder]);

  // Calculate the valid quantity (capped at available, or unlimited for non-trackable)
  const validQuantity = useMemo(() => {
    let qty = item.quantity;
    if (!isUnlimitedStock) {
      const effectiveAvailable =
        BundleUtils.getEffectiveAvailableQuantity(variant);
      if (effectiveAvailable != null) {
        qty = Math.min(qty, effectiveAvailable);
      }
    }
    if (maxPerOrder !== null) {
      qty = Math.min(qty, maxPerOrder);
    }
    return qty;
  }, [item.quantity, variant, isUnlimitedStock, maxPerOrder]);

  const handleIncrease = () => {
    // Check max per order limit
    if (maxPerOrder !== null && item.quantity >= maxPerOrder) {
      return;
    }
    // For unlimited stock, always allow increase
    if (isUnlimitedStock) {
      updateQuantity(item.id, item.quantity + 1);
      return;
    }
    const available = variant.availableQuantity ?? 0;
    if (item.quantity < available) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    removeItem(item.id);
  };

  const handleReduceToAvailable = () => {
    let targetQty = variant.availableQuantity ?? 0;
    if (maxPerOrder !== null) {
      targetQty = Math.min(targetQty, maxPerOrder);
    }
    if (targetQty > 0) {
      updateQuantity(item.id, targetQty);
    } else {
      removeItem(item.id);
    }
  };

  // Max reached is never true for unlimited stock products, but also check maxPerOrder
  const maxReached =
    (!isUnlimitedStock &&
      variant.availableQuantity != null &&
      item.quantity >= variant.availableQuantity) ||
    (maxPerOrder !== null && item.quantity >= maxPerOrder);

  const bundleItemCount = BundleUtils.getBundleItemCount(variant);
  const showBundleLabel =
    BundleUtils.isBundleVariant(variant) && bundleItemCount > 0;

  return (
    <div
      className={cn(
        "flex gap-3 sm:gap-4 py-4 border-b last:border-b-0 transition-opacity duration-200",
        isPending && "opacity-70",
        (quantityExceedsStock || quantityExceedsMaxPerOrder) &&
          "border-destructive/50",
      )}
    >
      {/* Product Image */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName || variant.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            {t("noImage")}
          </div>
        )}
        {/* Out of stock overlay */}
        {!variant.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-medium">
            {t("outOfStock")}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="space-y-1">
          <p className="font-medium text-sm sm:text-base line-clamp-2">
            {item.productName}
          </p>

          {variant.name && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {variant.name}
            </p>
          )}

          {modifiers.map((modifier) => (
            <p
              key={modifier.modifierId}
              className="text-xs text-muted-foreground"
            >
              + {modifier.name}
              {modifier.priceDelta > 0 &&
                ` (${formatCurrency(modifier.priceDelta, currency, locale)})`}
            </p>
          ))}

          {showBundleLabel && (
            <p className="text-xs text-muted-foreground">
              {tBundle("contains", { count: bundleItemCount })}
            </p>
          )}

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold sf-price tabular-nums">
              {formatCurrency(displayUnitPrice, currency, locale)}
            </p>
            {hasDiscount && listUnitPrice != null && listUnitPrice > displayUnitPrice && (
              <p className="text-xs text-muted-foreground sf-price line-through tabular-nums">
                {formatCurrency(listUnitPrice, currency, locale)}
              </p>
            )}
          </div>
        </div>

        {/* Stock Warning */}
        {quantityExceedsStock && (
          <div className="flex items-center gap-2 mt-2 p-2 rounded-md border border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-destructive">
                {variant.availableQuantity != null &&
                variant.availableQuantity < 5
                  ? t("quantityExceeded", {
                      available: variant.availableQuantity,
                    })
                  : t("quantityExceededGeneric")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={handleReduceToAvailable}
            >
              {(variant.availableQuantity ?? 0) > 0
                ? t("reduceQuantity")
                : t("remove")}
            </Button>
          </div>
        )}

        {/* Max per order warning */}
        {!quantityExceedsStock &&
          quantityExceedsMaxPerOrder &&
          maxPerOrder !== null && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-md border border-destructive/50 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-destructive">
                  {t("maxPerOrderExceeded", { max: maxPerOrder })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={handleReduceToAvailable}
              >
                {t("reduceQuantity")}
              </Button>
            </div>
          )}

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleDecrease}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>

            <span
              className={cn(
                "min-w-[2rem] text-center text-sm font-medium",
                (quantityExceedsStock || quantityExceedsMaxPerOrder) &&
                  "text-destructive",
              )}
            >
              {item.quantity}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleIncrease}
              disabled={maxReached || !variant.inStock}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Show pending indicator or total */}
            <span
              className={cn(
                "text-sm font-semibold tabular-nums flex items-center gap-1",
                (quantityExceedsStock || quantityExceedsMaxPerOrder) &&
                  "text-destructive",
              )}
            >
              {isPending && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
              {formatCurrency(
                quantityExceedsStock || quantityExceedsMaxPerOrder
                  ? validQuantity * displayUnitPrice
                  : displayLineTotal,
                currency,
                locale,
              )}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{t("remove")}</span>
            </Button>
          </div>
        </div>

        {/* Stock Status Messages */}
        {!variant.inStock && !quantityExceedsStock && (
          <p className="text-xs text-destructive mt-1">{t("outOfStock")}</p>
        )}

        {variant.inStock &&
          maxReached &&
          !quantityExceedsStock &&
          !quantityExceedsMaxPerOrder && (
            <p className="text-xs text-muted-foreground mt-1">
              {maxPerOrder !== null && item.quantity >= maxPerOrder
                ? t("maxPerOrderReached", { max: maxPerOrder })
                : t("maxQuantityReached")}
            </p>
          )}
      </div>
    </div>
  );
}
