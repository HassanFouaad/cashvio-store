'use client';

import { Button } from '@/components/ui/button';
import { useCartStore } from '@/features/cart/store';
import {
  PublicProductDto,
  PublicProductVariantDto,
} from '@/features/products/types/product.types';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  AlertCircle,
  Check,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useState } from 'react';

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
  const t = useTranslations('store.products');
  const tCart = useTranslations('cart');

  // Local state
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id || null
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

  // Cart quantity - derived from cart state for proper reactivity
  const cartQuantity = selectedVariantId && isInitialized && cart
    ? (cart.items.find(item => item.variant.id === selectedVariantId)?.quantity ?? 0)
    : 0;

  // Calculate remaining available (total - already in cart)
  const remainingAvailable = Math.max(0, totalAvailable - cartQuantity);

  // Check if item is in cart
  const isInCart = cartQuantity > 0;

  // Check if can add more to cart
  const canAddMore = isInStock && remainingAvailable > 0 && selectedVariant !== undefined && !isLoading;

  // Check if max is reached
  const isMaxReached = cartQuantity >= totalAvailable;

  // Helper to get variant cart quantity (for variant selector)
  const getVariantCartQuantity = useCallback((variantId: string) => {
    if (!isInitialized || !cart) return 0;
    return cart.items.find(item => item.variant.id === variantId)?.quantity ?? 0;
  }, [isInitialized, cart]);

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
      } else if (newQuantity <= totalAvailable) {
        // Update quantity in cart
        updateQuantity(selectedVariant.id, newQuantity);
      }
    },
    [selectedVariant, isInitialized, cartQuantity, totalAvailable, removeItem, updateQuantity]
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
      {/* Variant Selector - Mobile-first grid */}
      {variants.length > 1 && (
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-sm font-semibold">{t('selectVariant')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {variants.map((variant) => {
              const variantCartQty = getVariantCartQuantity(variant.id);
              const variantMaxReached = variantCartQty >= variant.availableQuantity;

              return (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelect(variant.id)}
                  disabled={!variant.inStock || variantMaxReached}
                  className={`relative px-3 py-2.5 sm:px-4 sm:py-3 text-sm rounded-lg border-2 transition-all touch-manipulation ${
                    variant.id === selectedVariantId
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/30'
                  } ${
                    !variant.inStock || variantMaxReached
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div className="font-medium truncate">{variant.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(variant.sellingPrice, currency, locale)}
                  </div>
                  {!variant.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-destructive bg-background/90 rounded-lg">
                      {t('outOfStock')}
                    </div>
                  )}
                  {variant.inStock && variantMaxReached && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-muted-foreground bg-background/90 rounded-lg">
                      {tCart('maxInCart')}
                    </div>
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
          <span>{tCart('maxQuantityReached')}</span>
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
                    {cartQuantity} {tCart('inCart')}
                  </span>
                  <span>
                    {remainingAvailable} {t('available')}
                  </span>
                </>
              ) : (
                <span>
                  {totalAvailable} {t('available')}
                </span>
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
                {tCart('viewCart')}
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
                  {tCart('adding')}
                </>
              ) : justAdded ? (
                <>
                  <Check className="h-5 w-5" />
                  {tCart('addedToCart')}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  {t('addToCart')}
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Out of stock - Clear message */}
      {!isInStock && (
        <Button size="lg" className="w-full h-12 sm:h-11" disabled>
          {t('outOfStock')}
        </Button>
      )}
    </div>
  );
}

