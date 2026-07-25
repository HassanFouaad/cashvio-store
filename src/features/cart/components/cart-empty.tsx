"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

/**
 * Empty cart state component
 * Client component - rendered inside CartList (client component)
 * Quiet, typography-led: plain thin-stroke icon, copy, one action.
 */
export function CartEmpty() {
  const t = useTranslations("cart");

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
      <ShoppingBag
        className="h-10 w-10 text-muted-foreground/50 mb-6"
        strokeWidth={1.25}
        aria-hidden
      />

      <h2 className="text-xl sm:text-2xl font-semibold mb-2">
        {t("emptyTitle")}
      </h2>

      <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-sm leading-relaxed">
        {t("emptyDescription")}
      </p>

      <Link
        href="/products"
        className={cn(buttonVariants({ size: "lg" }), "px-8")}
      >
        {t("startShopping")}
      </Link>
    </div>
  );
}
