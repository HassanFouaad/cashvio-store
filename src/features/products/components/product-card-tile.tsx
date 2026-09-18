import Link from "next/link";
import type { ReactElement } from "react";

import { PriceDisplay } from "@/features/products/components/price-display";
import { ProductCardMedia } from "@/features/products/components/product-card-media";
import {
  PRODUCT_CARD_LINK_CLASS,
  PRODUCT_CARD_TITLE_CLASS,
} from "@/features/products/constants/product-card";
import type { ProductCardViewProps } from "@/features/products/types/product-card.types";
import { cn } from "@/lib/utils/cn";

/** Compact, price-first cards retain the grocery theme's dense layout. */
export function ProductCardTile(props: ProductCardViewProps): ReactElement {
  const { product, currency, locale } = props;
  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        PRODUCT_CARD_LINK_CLASS,
        "overflow-hidden rounded-lg border border-border bg-card text-card-foreground",
      )}
    >
      <div className="relative aspect-square shrink-0 overflow-hidden bg-muted">
        <ProductCardMedia
          {...props}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
        />
      </div>
      <div className="flex-1 space-y-1 p-2 sm:p-2.5">
        <PriceDisplay
          product={product}
          currency={currency}
          locale={locale}
          effectiveClassName="text-sm font-semibold text-card-foreground"
        />
        <h3 className={cn(PRODUCT_CARD_TITLE_CLASS, "text-xs leading-snug")}>
          {product.name}
        </h3>
      </div>
    </Link>
  );
}
