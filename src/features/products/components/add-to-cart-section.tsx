"use client";

import { Button } from "@/components/ui/button";
import { ApiCartItemModifier } from "@/features/cart/api/cart.types";
import { useCartStore } from "@/features/cart/store";
import { ModifierGroupsPicker } from "@/features/products/components/modifier-groups-picker";
import { useModifierSelection } from "@/features/products/hooks/use-modifier-selection";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const tModifiers = useTranslations("store.products.modifiers");

  // Local state — default to first in-stock variant, fallback to first variant
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    () => {
      const inStockVariant = variants.find((v) => v.inStock);
      return inStockVariant?.id ?? variants[0]?.id ?? null;
    },
  );
  const [justAdded, setJustAdded] = useState(false);

  // Modifier groups (add-ons) — products with groups always use the Add
  // button flow: every add is one line keyed by its exact selection
  const modifierGroups = useMemo(
    () => product.modifierGroups ?? [],
    [product.modifierGroups],
  );
  const hasModifiers = modifierGroups.length > 0;
  const {
    selectedIds: selectedModifierIdSet,
    toggle: toggleModifier,
    selectedCountByGroup,
    modifiersTotal,
    allMinimumsMet,
    selectedModifierIds,
  } = useModifierSelection(modifierGroups);

  // Sticky mobile CTA — shown only while the inline controls are scrolled
  // out of view, so customers never lose the buy action on long pages
  const inlineControlsRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const target = inlineControlsRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: "-56px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Clean up the "just added" feedback timer on unmount
  const justAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (justAddedTimerRef.current) clearTimeout(justAddedTimerRef.current);
    };
  }, []);

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

  // Cart quantity - combined across lines of this variant (a variant may
  // sit on several lines with different modifier selections)
  const cartQuantity =
    selectedVariantId && isInitialized && cart
      ? cart.items.reduce(
          (sum, item) =>
            item.variant.id === selectedVariantId ? sum + item.quantity : sum,
          0,
        )
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

  // The quantity stepper only makes sense when a variant maps to exactly
  // one cart line — products with modifiers always use the Add button
  const isInCart = cartQuantity > 0 && !hasModifiers;

  // Check if can add more to cart
  const canAddMore =
    isInStock &&
    remainingAvailable > 0 &&
    selectedVariant !== undefined &&
    !isLoading &&
    (!hasModifiers || allMinimumsMet);

  // Check if max is reached (not applicable for unlimited stock, but check maxPerOrder)
  const isMaxReached =
    (!isUnlimitedStock && cartQuantity >= totalAvailable) ||
    (maxPerOrder !== null && cartQuantity >= maxPerOrder);

  // Helper to get variant cart quantity (for variant selector) — combined
  // across all lines of the variant
  const getVariantCartQuantity = useCallback(
    (variantId: string) => {
      if (!isInitialized || !cart) return 0;
      return cart.items.reduce(
        (sum, item) =>
          item.variant.id === variantId ? sum + item.quantity : sum,
        0,
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

  // The single cart line of the selected variant (stepper products only —
  // products without modifiers keep a 1:1 variant/line relationship)
  const selectedVariantLine =
    !hasModifiers && selectedVariantId && isInitialized && cart
      ? cart.items.find((item) => item.variant.id === selectedVariantId)
      : undefined;

  // Instant quantity change - directly updates the variant's cart line
  const handleQuantityChange = useCallback(
    (delta: number) => {
      if (!selectedVariant || !isInitialized || !selectedVariantLine) return;

      const newQuantity = cartQuantity + delta;

      if (newQuantity <= 0) {
        // Remove from cart
        removeItem(selectedVariantLine.id);
      } else if (
        (isUnlimitedStock || newQuantity <= totalAvailable) &&
        (maxPerOrder === null || newQuantity <= maxPerOrder)
      ) {
        // Update quantity in cart (unlimited stock allows any positive quantity, but respect maxPerOrder)
        updateQuantity(selectedVariantLine.id, newQuantity);
      }
    },
    [
      selectedVariant,
      isInitialized,
      selectedVariantLine,
      cartQuantity,
      totalAvailable,
      isUnlimitedStock,
      maxPerOrder,
      removeItem,
      updateQuantity,
    ],
  );

  // Handle add to cart — carries the current modifier selection
  const handleAddToCart = useCallback(() => {
    if (!selectedVariant || !canAddMore) return;

    // Display snapshot for the optimistic cart line
    const selectedModifiers: ApiCartItemModifier[] = [];
    for (const group of modifierGroups) {
      for (const modifier of group.modifiers) {
        if (selectedModifierIdSet.has(modifier.id)) {
          selectedModifiers.push({
            modifierId: modifier.id,
            groupName: group.name,
            name: modifier.name,
            priceDelta: modifier.priceDelta,
          });
        }
      }
    }

    // Add 1 item to cart
    addItem(
      selectedVariant.id,
      1,
      {
        variant: selectedVariant,
        productName: product.name,
        imageUrl: product.images?.[0]?.imageUrl,
        modifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined,
      },
      selectedModifierIds,
    );

    // Show success feedback
    setJustAdded(true);
    if (justAddedTimerRef.current) clearTimeout(justAddedTimerRef.current);
    justAddedTimerRef.current = setTimeout(() => {
      setJustAdded(false);
    }, 1500);
  }, [
    selectedVariant,
    canAddMore,
    addItem,
    product,
    modifierGroups,
    selectedModifierIdSet,
    selectedModifierIds,
  ]);

  // Handle remove from cart
  const handleRemoveFromCart = useCallback(() => {
    if (!selectedVariantLine) return;
    removeItem(selectedVariantLine.id);
  }, [selectedVariantLine, removeItem]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dynamic Price & Stock — updates with variant and add-on selection */}
      {selectedVariant && (
        <div className="space-y-3">
          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-semibold">
              {formatCurrency(
                selectedVariant.sellingPrice + modifiersTotal,
                currency,
                locale,
              )}
            </span>
            {hasModifiers && modifiersTotal > 0 && (
              <span className="text-sm text-muted-foreground">
                {tModifiers("includesAddOns", {
                  amount: formatCurrency(modifiersTotal, currency, locale),
                })}
              </span>
            )}
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
                    <div className="absolute -top-1.5 -end-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {variantCartQty}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add-on picker — one section per modifier group */}
      {hasModifiers && (
        <ModifierGroupsPicker
          groups={modifierGroups}
          selectedIds={selectedModifierIdSet}
          selectedCountByGroup={selectedCountByGroup}
          onToggle={toggleModifier}
          currency={currency}
          locale={locale}
        />
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
        <div className="space-y-3" ref={inlineControlsRef}>
          {/* Stock info */}
          {isInitialized && (
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              {cartQuantity > 0 ? (
                <>
                  <span>
                    {cartQuantity} {tCart("inCart")}
                  </span>
                  <div className="flex gap-2">
                    {!isUnlimitedStock && totalAvailable < 5 && (
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
                  {!isUnlimitedStock && totalAvailable < 5 && (
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
                    aria-label={tCart("remove")}
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
                    aria-label={tCart("decreaseQuantity")}
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
                  aria-label={tCart("increaseQuantity")}
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
            /* Not in cart (or add-on product) - Show add to cart button */
            <div className="space-y-2">
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
              {hasModifiers && !allMinimumsMet && (
                <p className="text-xs text-amber-600 dark:text-amber-500 text-center">
                  {tModifiers("completeRequired")}
                </p>
              )}
              {hasModifiers && cartQuantity > 0 && (
                <Link
                  href="/cart"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted/60 touch-manipulation"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {tCart("viewCart")} ({cartQuantity})
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Out of stock - Clear message */}
      {!isInStock && (
        <Button size="lg" className="w-full h-12 sm:h-11" disabled>
          {t("outOfStock")}
        </Button>
      )}

      {/* Sticky mobile CTA — appears when inline controls scroll away */}
      {selectedVariant && isInStock && showStickyBar && (
        <div className="fixed-bottom-cta fixed inset-x-0 z-40 px-3 md:hidden">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/95 backdrop-blur p-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">
                {selectedVariant.name || product.name}
              </p>
              <p className="text-base font-bold">
                {formatCurrency(
                  selectedVariant.sellingPrice + modifiersTotal,
                  currency,
                  locale,
                )}
              </p>
            </div>
            {isInCart ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg touch-manipulation"
                  onClick={() =>
                    cartQuantity === 1
                      ? handleRemoveFromCart()
                      : handleQuantityChange(-1)
                  }
                  disabled={isLoading}
                  aria-label={
                    cartQuantity === 1
                      ? tCart("remove")
                      : tCart("decreaseQuantity")
                  }
                >
                  {cartQuantity === 1 ? (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                </Button>
                <span className="min-w-[2.5rem] text-center text-lg font-bold tabular-nums">
                  {cartQuantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg touch-manipulation"
                  onClick={() => handleQuantityChange(1)}
                  disabled={isMaxReached || isLoading}
                  aria-label={tCart("increaseQuantity")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                className="h-10 gap-1.5 touch-manipulation"
                disabled={!canAddMore}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4" />
                {t("addToCart")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
