'use client';

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/features/cart/store";
import {
    PublicProductDto,
    PublicProductVariantDto,
} from "@/features/products/types/product.types";
import { formatCurrency } from "@/lib/utils/formatters";
import { Check, Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
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
 * Handles variant selection, quantity, and add to cart
 * Keeps cart logic separate from SSR content
 */
export function AddToCartSection({
  product,
  variants,
  currency,
  locale,
  storeId,
}: AddToCartSectionProps) {
  const t = useTranslations("store.products");
  const tCart = useTranslations("cart");

  // Zustand store - select only what's needed
  const addItem = useCartStore((state) => state.addItem);
  const isInCartFn = useCartStore((state) => state.isInCart);
  const getItemQuantityFn = useCartStore((state) => state.getItemQuantity);
  const isHydrated = useCartStore((state) => state.isHydrated);

  // Local state
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id || null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Derived state
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const isInStock = selectedVariant?.inStock ?? false;
  const maxQuantity = selectedVariant?.availableQuantity ?? 0;
  const canAddToCart = isInStock && quantity > 0 && selectedVariant !== undefined;

  // Cart state for selected variant - only access after hydration to prevent SSR mismatch
  const variantInCart = isHydrated && selectedVariantId ? isInCartFn(selectedVariantId) : false;
  const cartQuantity = isHydrated && selectedVariantId ? getItemQuantityFn(selectedVariantId) : 0;

  // Handlers
  const handleVariantSelect = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
    setJustAdded(false);
  }, []);

  const handleQuantityChange = useCallback(
    (delta: number) => {
      setQuantity((prev) => {
        const newQuantity = prev + delta;
        if (newQuantity >= 1 && newQuantity <= maxQuantity) {
          return newQuantity;
        }
        return prev;
      });
    },
    [maxQuantity]
  );

  const handleAddToCart = useCallback(() => {
    if (!selectedVariant || !canAddToCart) return;

    setIsAdding(true);

    addItem({
      product,
      variant: selectedVariant,
      quantity,
      currency,
      storeId,
    });

    // Show success feedback
    const feedbackTimer = setTimeout(() => {
      setIsAdding(false);
      setJustAdded(true);
      setQuantity(1);

      // Reset justAdded after animation
      const resetTimer = setTimeout(() => {
        setJustAdded(false);
      }, 2000);

      return () => clearTimeout(resetTimer);
    }, 300);

    return () => clearTimeout(feedbackTimer);
  }, [selectedVariant, canAddToCart, addItem, product, quantity, currency, storeId]);

  return (
    <div className="space-y-6">
      {/* Variant Selector */}
      {variants.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">{t("selectVariant")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantSelect(variant.id)}
                disabled={!variant.inStock}
                className={`relative px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                  variant.id === selectedVariantId
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                } ${
                  !variant.inStock
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="font-medium">{variant.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(variant.sellingPrice, currency, locale)}
                </div>
                {!variant.inStock && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-destructive bg-background/80 rounded-lg">
                    {t("outOfStock")}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      {isInStock && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">{t("quantity")}</h2>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-lg font-medium tabular-nums">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= maxQuantity}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full gap-2"
          disabled={!canAddToCart || isAdding}
          onClick={handleAddToCart}
        >
          {isAdding ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {tCart("addedToCart")}
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

        {/* Show cart quantity if item already in cart - only after hydration */}
        {isHydrated && variantInCart && !justAdded && (
          <p className="text-sm text-center text-muted-foreground">
            {cartQuantity} {cartQuantity === 1 ? tCart("item") : tCart("items")}{" "}
            {tCart("inCart", { defaultValue: "in cart" })}
          </p>
        )}
      </div>
    </div>
  );
}
