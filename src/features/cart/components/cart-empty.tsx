"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Package, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

/**
 * Empty cart state component
 * Client component - rendered inside CartList (client component)
 * Enhanced with engaging illustration and suggested action
 */
export function CartEmpty() {
  const t = useTranslations("cart");

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-muted/80">
          <ShoppingBag className="h-12 w-12 sm:h-14 sm:w-14 text-muted-foreground/60" />
        </div>
        {/* Small floating accent */}
        <div className="absolute -top-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-background">
          <Package className="h-4 w-4 text-primary/60" />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold mb-2">
        {t("emptyTitle")}
      </h2>

      <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-sm leading-relaxed">
        {t("emptyDescription")}
      </p>

      <Link
        href="/products"
        className={cn(buttonVariants({ size: "lg" }), "gap-2 px-8")}
      >
        <ShoppingBag className="h-4 w-4" />
        {t("startShopping")}
      </Link>
    </div>
  );
}
