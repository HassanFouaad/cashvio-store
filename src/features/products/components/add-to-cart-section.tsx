"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/features/cart/store";
import {
  PublicProductDto,
  PublicProductVariantDto,
} from "@/features/products/types/product.types";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  AlertCircle,
  Check,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useState } from "react";

interface AddToCartSectionProps {
  product: PublicProductDto;
  variants: PublicProductVariantDto[];
  currency: string;
  locale: string;
  storeId: string;
}

/**
 * Client component for cart interactions
 * Mobile-first design with instant quantity updates
 * Validates against available stock including cart quantity
 */
export function AddToCartSection({
  product,
  variants,
  currency,
  locale,
}: AddToCartSectionProps) {
  const t = useTranslations("store.products");
  const tCart = useTranslations("cart");

  // Local state — default to first in-stock variant, fallback to first variant
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    () => {
      const inStockVariant = variants.find((v) => v.inStock);
      return inStockVariant?.id ?? variants[0]?.id ?? null;
    },
  );
  const [justAdded, setJustAdded] = useState(false);

  // Zustand store - subscribe to cart state directly for reactivity
  const isInitialized = useCartStore((state) => state.isInitialized);
  const isLoading = useCartStore((state) => state.isLoading);
  const cart = useCartStore((state) => state.cart);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // Derived state
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const isInStock = selectedVariant?.inStock ?? false;
  const totalAvailable = selectedVariant?.availableQuantity ?? 0;

  // Non-trackable inventory products - check variant-level flag
  const isInventoryTrackable = selectedVariant?.inventoryTrackable !== false;
  const isUnlimitedStock = !isInventoryTrackable;

  // Max quantity per order (null = unlimited)
  const maxPerOrder = selectedVariant?.maxQuantityPerOrder ?? null;

  // Cart quantity - derived from cart state for proper reactivity
  const cartQuantity =
    selectedVariantId && isInitialized && cart
      ? (cart.items.find((item) => item.variant.id === selectedVariantId)
          ?.quantity ?? 0)
      : 0;

  // Calculate remaining available (total - already in cart)
  // For unlimited stock, set a very high remaining value
  let remainingAvailable = isUnlimitedStock
    ? 999999
    : Math.max(0, totalAvailable - cartQuantity);

  // Also cap by max per order if set
  if (maxPerOrder !== null) {
    const remainingPerOrder = Math.max(0, maxPerOrder - cartQuantity);
    remainingAvailable = Math.min(remainingAvailable, remainingPerOrder);
  }

  // Check if item is in cart
  const isInCart = cartQuantity > 0;

  // Check if can add more to cart
  const canAddMore =
    isInStock &&
    remainingAvailable > 0 &&
    selectedVariant !== undefined &&
    !isLoading;

  // Check if max is reached (not applicable for unlimited stock, but check maxPerOrder)
  const isMaxReached =
    (!isUnlimitedStock && cartQuantity >= totalAvailable) ||
    (maxPerOrder !== null && cartQuantity >= maxPerOrder);

  // Helper to get variant cart quantity (for variant selector)
  const getVariantCartQuantity = useCallback(
    (variantId: string) => {
      if (!isInitialized || !cart) return 0;
      return (
        cart.items.find((item) => item.variant.id === variantId)?.quantity ?? 0
      );
    },
    [isInitialized, cart],
  );

  // Helper to check if variant has unlimited stock
  const isVariantUnlimitedStock = useCallback(
    (variant: PublicProductVariantDto) => {
      return variant.inventoryTrackable === false;
    },
    [],
  );

  // Handlers
  const handleVariantSelect = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
    setJustAdded(false);
  }, []);

  // Instant quantity change - directly updates cart
  const handleQuantityChange = useCallback(
    (delta: number) => {
      if (!selectedVariant || !isInitialized) return;

      const newQuantity = cartQuantity + delta;

      if (newQuantity <= 0) {
        // Remove from cart
        removeItem(selectedVariant.id);
      } else if (
        (isUnlimitedStock || newQuantity <= totalAvailable) &&
        (maxPerOrder === null || newQuantity <= maxPerOrder)
      ) {
        // Update quantity in cart (unlimited stock allows any positive quantity, but respect maxPerOrder)
        updateQuantity(selectedVariant.id, newQuantity);
      }
    },
    [
      selectedVariant,
      isInitialized,
      cartQuantity,
      totalAvailable,
      isUnlimitedStock,
      maxPerOrder,
      removeItem,
      updateQuantity,
    ],
  );

  // Handle initial add to cart (when not in cart yet)
  const handleAddToCart = useCallback(() => {
    if (!selectedVariant || !canAddMore) return;

    // Add 1 item to cart
    addItem(selectedVariant.id, 1, {
      variant: selectedVariant,
      productName: product.name,
      imageUrl: product.images?.[0]?.imageUrl,
    });

    // Show success feedback
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1500);
  }, [selectedVariant, canAddMore, addItem, product]);

  // Handle remove from cart
  const handleRemoveFromCart = useCallback(() => {
    if (!selectedVariant) return;
    removeItem(selectedVariant.id);
  }, [selectedVariant, removeItem]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dynamic Price & Stock — updates when the user switches variants */}
      {selectedVariant && (
        <div className="space-y-3">
          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-semibold">
              {formatCurrency(selectedVariant.sellingPrice, currency, locale)}
            </span>
            {product.taxIncluded && product.taxRate && (
              <span className="text-sm text-muted-foreground">
                {t("taxIncluded")}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {isInStock ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-500">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {t("inStock")}
                </span>
                {!isUnlimitedStock &&
                  totalAvailable > 0 &&
                  totalAvailable < 5 && (
                    <span className="text-sm text-amber-600 dark:text-amber-500">
                      — {t("leftInStock", { count: totalAvailable })}
                    </span>
                  )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-500">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {t("outOfStock")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Variant Selector - Mobile-first grid */}
      {variants.length > 1 && (
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-sm font-semibold">{t("selectVariant")}</h2>
          <div className="grid grid-cols-2 gap-2">
            {variants.map((variant) => {
              const variantCartQty = getVariantCartQuantity(variant.id);
              const variantUnlimited = isVariantUnlimitedStock(variant);
              const variantMaxReached =
                (!variantUnlimited &&
                  variantCartQty >= variant.availableQuantity) ||
                (variant.maxQuantityPerOrder != null &&
                  variantCartQty >= variant.maxQuantityPerOrder);

              const isOos = !variant.inStock;

              return (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelect(variant.id)}
                  disabled={isOos || variantMaxReached}
                  className={`relative px-3 py-2.5 sm:px-4 sm:py-3 text-sm rounded-lg border-2 transition-all touch-manipulation ${
                    variant.id === selectedVariantId
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  } ${
                    isOos || variantMaxReached
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer active:scale-[0.98]"
                  }`}
                >
                  <div
                    className={`font-medium truncate ${isOos ? "text-muted-foreground" : ""}`}
                  >
                    {variant.name}
                  </div>
                  <div
                    className={`text-xs ${isOos ? "line-through text-muted-foreground/70" : "text-muted-foreground"}`}
                  >
                    {formatCurrency(variant.sellingPrice, currency, locale)}
                  </div>
                  {isOos && (
                    <span className="mt-0.5 inline-block text-[10px] font-semibold uppercase tracking-wide text-destructive">
                      {t("outOfStock")}
                    </span>
                  )}
                  {!isOos && variantMaxReached && (
                    <span className="mt-0.5 inline-block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {tCart("maxInCart")}
                    </span>
                  )}
                  {variantCartQty > 0 && !variantMaxReached && (
                    <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {variantCartQty}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Max Reached Warning - More compact on mobile */}
      {isInitialized && isInStock && isMaxReached && (
        <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg border border-muted-foreground/30 text-muted-foreground text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {maxPerOrder !== null && cartQuantity >= maxPerOrder
              ? tCart("maxPerOrderReached", { max: maxPerOrder })
              : tCart("maxQuantityReached")}
          </span>
        </div>
      )}

      {/* Quantity Controls - Different UX based on cart state */}
      {isInStock && (
        <div className="space-y-3">
          {/* Stock info */}
          {isInitialized && (
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              {cartQuantity > 0 ? (
                <>
                  <span>
                    {cartQuantity} {tCart("inCart")}
                  </span>
                  <div className="flex gap-2">
                    {!isUnlimitedStock && (
                      <span>
                        {Math.max(0, totalAvailable - cartQuantity)}{" "}
                        {t("available")}
                      </span>
                    )}
                    {maxPerOrder !== null && (
                      <span>
                        ({tCart("maxPerOrder", { max: maxPerOrder })})
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  {!isUnlimitedStock && (
                    <span>
                      {totalAvailable} {t("available")}
                    </span>
                  )}
                  {maxPerOrder !== null && (
                    <span>({tCart("maxPerOrder", { max: maxPerOrder })})</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* In Cart - Show quantity controls */}
          {isInCart ? (
            <div className="flex flex-col gap-3">
              {/* Quantity adjuster - Large touch targets for mobile */}
              <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 rounded-xl">
                {cartQuantity === 1 ? (
                  // Show trash icon when quantity is 1
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 sm:h-10 sm:w-10 rounded-lg touch-manipulation"
                    onClick={handleRemoveFromCart}
                    disabled={isLoading}
                    aria-label="Remove from cart"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 sm:h-10 sm:w-10 rounded-lg touch-manipulation"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={isLoading}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
                <span className="min-w-[4rem] text-center text-xl sm:text-lg font-bold tabular-nums">
                  {cartQuantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 sm:h-10 sm:w-10 rounded-lg touch-manipulation"
                  onClick={() => handleQuantityChange(1)}
                  disabled={isMaxReached || isLoading}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* View cart link */}
              <Link
                href="/cart"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 active:bg-primary/80 touch-manipulation"
              >
                <ShoppingCart className="h-5 w-5" />
                {tCart("viewCart")}
              </Link>
            </div>
          ) : (
            /* Not in cart - Show add to cart button */
            <Button
              size="lg"
              className="w-full gap-2 h-12 sm:h-11 text-base font-medium touch-manipulation"
              disabled={!canAddMore}
              onClick={handleAddToCart}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {tCart("adding")}
                </>
              ) : justAdded ? (
                <>
                  <Check className="h-5 w-5" />
                  {tCart("addedToCart")}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  {t("addToCart")}
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Out of stock - Clear message */}
      {!isInStock && (
        <Button size="lg" className="w-full h-12 sm:h-11" disabled>
          {t("outOfStock")}
        </Button>
      )}
    </div>
  );
}
