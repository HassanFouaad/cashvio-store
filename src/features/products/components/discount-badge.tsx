import { ProductDiscountDto } from "@/features/products/types/product-discount.types";
import { CatalogueDiscountUtils } from "@/features/products/utils/catalogue-discount.utils";
import { cn } from "@/lib/utils/cn";
import { getTranslations } from "next-intl/server";

interface DiscountBadgeProps {
  discount: ProductDiscountDto;
  currency: string;
  locale: string;
  savingsAmount?: number;
  isPartialProduct?: boolean;
  className?: string;
}

export async function DiscountBadge({
  discount,
  currency,
  locale,
  savingsAmount,
  isPartialProduct,
  className,
}: DiscountBadgeProps) {
  const t = await getTranslations();
  const label = CatalogueDiscountUtils.formatBadgeLabel(
    discount,
    t,
    currency,
    locale,
    { savingsAmount, isPartialProduct },
  );

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
