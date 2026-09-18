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

/** A stable scrim keeps names and prices readable even over white photography. */
export function ProductCardOverlay(props: ProductCardViewProps): ReactElement {
  const { product, currency, locale } = props;
  const reviewCount = product.reviewCount ?? 0;
  const hasRating = reviewCount > 0 && product.averageRating != null;
  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        PRODUCT_CARD_LINK_CLASS,
        "relative aspect-[4/5] overflow-hidden rounded-xl bg-muted",
      )}
    >
      <ProductCardMedia {...props} isOverlay />
      <div className="absolute start-0 end-0 bottom-0 space-y-1.5 bg-media-scrim/80 p-3 text-media-foreground">
        <h3 className={cn(PRODUCT_CARD_TITLE_CLASS, "font-semibold")}>
          {product.name}
        </h3>
        {hasRating && (
          <div className="flex items-center gap-1">
            <StarRatingDisplay
              rating={Math.round(product.averageRating ?? 0)}
              size="sm"
            />
            <span className="text-xs text-media-foreground/85">
              ({reviewCount})
            </span>
          </div>
        )}
        <PriceDisplay
          product={product}
          currency={currency}
          locale={locale}
          overlay
          effectiveClassName="text-sm font-semibold"
        />
      </div>
    </Link>
  );
}
