import Link from "next/link";
import type { ReactElement } from "react";

import { PriceDisplay } from "@/features/products/components/price-display";
import { ProductCardMedia } from "@/features/products/components/product-card-media";
import { StarRatingDisplay } from "@/features/products/components/star-rating";
import {
  PRODUCT_CARD_LINK_CLASS,
  PRODUCT_CARD_TITLE_CLASS,
} from "@/features/products/constants/product-card";
import type { ProductCardViewProps } from "@/features/products/types/product-card.types";
import { cn } from "@/lib/utils/cn";

/** Editorial proportions remain distinct; custom corner settings still apply. */
export function ProductCardMinimal(props: ProductCardViewProps): ReactElement {
  const { product, currency, locale } = props;
  const reviewCount = product.reviewCount ?? 0;
  const hasRating = reviewCount > 0 && product.averageRating != null;
  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(PRODUCT_CARD_LINK_CLASS, "rounded-sm")}
    >
      <div className="relative mb-3 aspect-[3/4] shrink-0 overflow-hidden rounded-sm bg-muted">
        <ProductCardMedia {...props} />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h3
          className={cn(
            PRODUCT_CARD_TITLE_CLASS,
            "uppercase tracking-[0.08em] leading-snug rtl:tracking-normal",
          )}
        >
          {product.name}
        </h3>
        {hasRating && (
          <div className="flex items-center gap-1">
            <StarRatingDisplay
              rating={Math.round(product.averageRating ?? 0)}
              size="sm"
            />
            <span className="text-xs text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
        )}
        <div className="mt-auto pt-0.5">
          <PriceDisplay
            product={product}
            currency={currency}
            locale={locale}
            effectiveClassName="text-sm"
            originalClassName="text-xs"
          />
        </div>
      </div>
    </Link>
  );
}
