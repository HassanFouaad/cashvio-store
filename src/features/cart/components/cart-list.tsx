"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Loader2, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSharedCartPreview } from "./cart-preview-provider";
import { CartPreviewMatchUtils } from "../utils/cart-preview-match.utils";
import { useCartStore, useIsCartSyncing } from "../store";
import { CartEmpty } from "./cart-empty";
import { CartItem } from "./cart-item";

interface CartListProps {
  currency: string;
  locale: string;
}

/** How long the destructive "confirm clear" state stays armed */
const CLEAR_CONFIRM_TIMEOUT_MS = 4000;

/**
 * Cart items list component
 * Displays all items in cart or empty state
 */
export function CartList({ currency, locale }: CartListProps) {
  const t = useTranslations("cart");
  const { cart, clearCart, isInitialized, isLoading } = useCartStore();
  const isSyncing = useIsCartSyncing();
  const { preview } = useSharedCartPreview();

  // Two-step destructive action: first tap arms, second tap clears
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Removed-items notice (backend drops unavailable variants from the cart)
  const removedIds = cart?.removedVariantIds ?? [];
  const [dismissedRemovedKey, setDismissedRemovedKey] = useState("");
  const removedKey = removedIds.join(",");
  const showRemovedNotice =
    removedIds.length > 0 && removedKey !== dismissedRemovedKey;

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

  const handleClearClick = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      confirmTimeoutRef.current = setTimeout(
        () => setIsConfirmingClear(false),
        CLEAR_CONFIRM_TIMEOUT_MS,
      );
      return;
    }

    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    setIsConfirmingClear(false);
    void clearCart();
  };

  // Show loading skeleton while initializing
  if (!isInitialized || isLoading) {
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

  // Items silently removed by the store (out of stock / unpublished)
  const removedNotice = showRemovedNotice ? (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border text-sm">
      <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
      <p className="flex-1 text-muted-foreground">{t("removedItemsNotice")}</p>
      <button
        type="button"
        onClick={() => setDismissedRemovedKey(removedKey)}
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={t("dismiss")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  ) : null;

  // The notice outlives the items: removing the last line empties the cart,
  // and the shopper still needs to know why it went empty
  if (!cart || cart.items.length === 0) {
    return (
      <div className="space-y-4">
        {removedNotice}
        <CartEmpty />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Continue Shopping link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("continueShopping")}
      </Link>

      {removedNotice}

      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {t("yourCart")} ({cart.itemCount})
          {isSyncing && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </h2>

        <Button
          variant={isConfirmingClear ? "destructive" : "ghost"}
          size="sm"
          className={
            isConfirmingClear
              ? undefined
              : "text-muted-foreground hover:text-destructive"
          }
          onClick={handleClearClick}
        >
          <Trash2 className="h-4 w-4 me-2" />
          {isConfirmingClear ? t("clearAllConfirm") : t("clearAll")}
        </Button>
      </div>

      {/* Cart Items */}
      <div className="divide-y">
        {cart.items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            currency={currency}
            locale={locale}
            previewItem={CartPreviewMatchUtils.matchPreviewItem(
              item,
              preview?.items,
            )}
          />
        ))}
      </div>
    </div>
  );
}
