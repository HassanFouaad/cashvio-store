import { PublicProductDto } from "@/features/products/types/product.types";
import {
  formatProductPrice,
} from "@/features/products/utils/product-helpers";
import { CatalogueDiscountUtils } from "@/features/products/utils/catalogue-discount.utils";
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
}: PriceDisplayProps) {
  const effectivePrice = formatProductPrice(product, currency, locale);
  const originalPrice = CatalogueDiscountUtils.formatOriginalProductPrice(
    product,
    currency,
    locale,
  );
  const hasDiscount = CatalogueDiscountUtils.hasProductDiscount(product);
  const showStrikeThrough =
    CatalogueDiscountUtils.shouldShowCardStrikeThrough(product);

  if (!effectivePrice) {
    return null;
  }

  const effectiveClasses = cn(
    "sf-price tabular-nums",
    overlay ? "text-white" : "text-foreground",
    effectiveClassName,
  );
  const originalClasses = cn(
    "sf-price text-xs tabular-nums line-through",
    overlay ? "text-white/70" : "text-muted-foreground",
    originalClassName,
  );

  if (!hasDiscount || !originalPrice || !showStrikeThrough) {
    return <p className={effectiveClasses}>{effectivePrice}</p>;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <p className={effectiveClasses}>{effectivePrice}</p>
      <p className={originalClasses}>{originalPrice}</p>
    </div>
  );
}
