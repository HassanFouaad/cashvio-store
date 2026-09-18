import Link from "next/link";
import type { ReactElement } from "react";

import { PriceDisplay } from "@/features/products/components/price-display";
import { ProductCardMedia } from "@/features/products/components/product-card-media";
import { ProductCardMinimal } from "@/features/products/components/product-card-minimal";
import { ProductCardOverlay } from "@/features/products/components/product-card-overlay";
import { ProductCardTile } from "@/features/products/components/product-card-tile";
import { StarRatingDisplay } from "@/features/products/components/star-rating";
import {
  PRODUCT_CARD_LINK_CLASS,
  PRODUCT_CARD_TITLE_CLASS,
} from "@/features/products/constants/product-card";
import type { ProductCardProps } from "@/features/products/types/product-card.types";
import { StoreFrontThemeProductCardVariant } from "@/features/store/types/store.types";
import { cn } from "@/lib/utils/cn";

export function ProductCard({
  product,
  currency,
  locale,
  translations,
  variant = StoreFrontThemeProductCardVariant.STANDARD,
}: ProductCardProps): ReactElement {
  const props = { product, currency, locale, translations };
  switch (variant) {
    case StoreFrontThemeProductCardVariant.OVERLAY:
      return <ProductCardOverlay {...props} />;
    case StoreFrontThemeProductCardVariant.MINIMAL:
      return <ProductCardMinimal {...props} />;
    case StoreFrontThemeProductCardVariant.TILE:
      return <ProductCardTile {...props} />;
  }
  const reviewCount = product.reviewCount ?? 0;
  const hasRating = reviewCount > 0 && product.averageRating != null;

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(PRODUCT_CARD_LINK_CLASS, "rounded-xl")}
    >
      <div className="relative mb-3 aspect-square shrink-0 overflow-hidden rounded-xl bg-muted">
        <ProductCardMedia {...props} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-0.5">
        <h3 className={PRODUCT_CARD_TITLE_CLASS}>{product.name}</h3>
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
            effectiveClassName="text-sm font-semibold"
          />
        </div>
      </div>
    </Link>
  );
}
