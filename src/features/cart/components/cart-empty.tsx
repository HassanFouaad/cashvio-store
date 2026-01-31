'use client';

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

/**
 * Empty cart state component
 * Client component - rendered inside CartList (client component)
 */
export function CartEmpty() {
  const t = useTranslations("cart");

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
      <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted mb-6">
        <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold mb-2">
        {t("emptyTitle")}
      </h2>

      <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md">
        {t("emptyDescription")}
      </p>

      <Link href="/products" className={cn(buttonVariants({ size: "lg" }))}>
        {t("startShopping")}
      </Link>
    </div>
  );
}
