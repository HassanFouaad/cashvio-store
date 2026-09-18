import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { ReactElement } from "react";

import { BundleBadge } from "@/features/products/components/bundle-badge";
import { DiscountBadge } from "@/features/products/components/discount-badge";
import { PRODUCT_CARD_IMAGE_SIZES } from "@/features/products/constants/product-card";
import type { ProductCardMediaProps } from "@/features/products/types/product-card.types";
import { getPrimaryImage, isProductInStock } from "@/features/products/utils";
import { BundleUtils } from "@/features/products/utils/bundle.utils";
import { CatalogueDiscountUtils } from "@/features/products/utils/catalogue-discount.utils";
import { cn } from "@/lib/utils/cn";

/** Shared server-rendered media keeps availability and promotion cues consistent. */
export function ProductCardMedia({
  product,
  currency,
  locale,
  translations,
  sizes = PRODUCT_CARD_IMAGE_SIZES,
  isOverlay = false,
}: ProductCardMediaProps): ReactElement {
  const image = getPrimaryImage(product);
  const inStock = isProductInStock(product);
  const discountBadge =
    CatalogueDiscountUtils.pickProductDiscountBadge(product);
  const isBundle = BundleUtils.isProductBundle(product);

  return (
    <>
      {image ? (
        <Image
          src={image.thumbnailUrl || image.imageUrl}
          alt={image.altText || product.name}
          fill
          sizes={sizes}
          className="object-cover sf-img-zoom"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
          <ImageOff aria-hidden="true" className="h-8 w-8" strokeWidth={1.5} />
          <span className="text-xs">{translations.noImageAvailable}</span>
        </div>
      )}
      {inStock && (discountBadge || isBundle) && (
        <div className="absolute top-2 start-2 z-10 flex flex-col items-start gap-1">
          {discountBadge && (
            <DiscountBadge
              discount={discountBadge.discount}
              savingsAmount={discountBadge.savingsAmount}
              isPartialProduct={discountBadge.isPartialProduct}
              currency={currency}
              locale={locale}
            />
          )}
          {isBundle && <BundleBadge />}
        </div>
      )}
      {!inStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-media-scrim/40">
          <span
            className={cn(
              "max-w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-center text-xs font-medium text-foreground",
              isOverlay && "absolute top-2 end-2 start-2",
            )}
          >
            {translations.outOfStock}
          </span>
        </div>
      )}
    </>
  );
}
