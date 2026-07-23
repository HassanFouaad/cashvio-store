"use client";

import { Button } from "@/components/ui/button";
import { useCartItemCount } from "@/features/cart/store";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface HeaderCartButtonProps {
  /** Show on all breakpoints instead of desktop-only */
  isAlwaysVisible?: boolean;
}

/**
 * Cart icon button with the live item-count badge (desktop header slot —
 * mobile uses the bottom navigation cart).
 */
export function HeaderCartButton({ isAlwaysVisible }: HeaderCartButtonProps) {
  const t = useTranslations();
  const cartItemCount = useCartItemCount();

  return (
    <Link href="/cart" className={isAlwaysVisible ? "block" : "hidden md:block"}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 sm:h-10 sm:w-10"
        title={t("store.shoppingCart")}
      >
        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="sr-only">{t("store.shoppingCart")}</span>
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {cartItemCount > 99 ? "99+" : cartItemCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
