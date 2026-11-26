import type { ReactElement } from "react";

import { Money } from "@/components/ui/money";
import { PublicProductDto } from "@/features/products/types/product.types";
import { CatalogueDiscountUtils } from "@/features/products/utils/catalogue-discount.utils";
import { getPriceRange } from "@/features/products/utils/product-helpers";
import { cn } from "@/lib/utils/cn";

interface PriceDisplayProps {
  product: PublicProductDto;
  currency: string;
  locale: string;
  effectiveClassName?: string;
  originalClassName?: string;
  overlay?: boolean;
}

export function PriceDisplay({
  product,
  currency,
  locale,
  effectiveClassName,
  originalClassName,
  overlay = false,
}: PriceDisplayProps): ReactElement | null {
  const variants = product.variants ?? [];
  const effectivePrice = getPriceRange(
    variants.map((variant) => variant.sellingPrice),
  );
  if (!effectivePrice) {
    return null;
  }

  const originalPrice = CatalogueDiscountUtils.shouldShowCardStrikeThrough(
    product,
  )
    ? getPriceRange(
        variants
          .map((variant) => variant.originalSellingPrice)
          .filter((price): price is number => price != null && price > 0),
      )
    : null;
  const currentPrice = (
    <p
      className={cn(
        overlay ? "text-media-foreground" : "text-foreground",
        effectiveClassName,
      )}
    >
      <Money
        amount={effectivePrice.minPrice}
        maximumAmount={effectivePrice.maxPrice}
        currency={currency}
        locale={locale}
      />
    </p>
  );

  if (!originalPrice) return currentPrice;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      {currentPrice}
      <p
        className={cn(
          "text-xs line-through",
          overlay ? "text-media-foreground/85" : "text-muted-foreground",
          originalClassName,
        )}
      >
        <Money
          amount={originalPrice.minPrice}
          maximumAmount={originalPrice.maxPrice}
          currency={currency}
          locale={locale}
        />
      </p>
    </div>
  );
}
