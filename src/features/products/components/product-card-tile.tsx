import { DiscountBadge } from "@/features/products/components/discount-badge";
import { BundleBadge } from "@/features/products/components/bundle-badge";
import { PriceDisplay } from "@/features/products/components/price-display";
import { PublicProductDto } from "@/features/products/types/product.types";
import { CatalogueDiscountUtils } from "@/features/products/utils/catalogue-discount.utils";
import { BundleUtils } from "@/features/products/utils/bundle.utils";
import {
  getPrimaryImage,
  isProductInStock,
  ProductCardTranslations,
} from "@/features/products/utils";
import Image from "next/image";
import Link from "next/link";

interface ProductCardTileProps {
  product: PublicProductDto;
  currency: string;
  locale: string;
  translations: ProductCardTranslations;
}

/**
 * TILE product card — dense, bordered, price-forward utility tile for
 * market/grocery themes: the price leads, the name is secondary. Server
 * component - no client-side hooks for SEO.
 */
export function ProductCardTile({
  product,
  currency,
  locale,
  translations,
}: ProductCardTileProps) {
  const primaryImage = getPrimaryImage(product);
  const inStock = isProductInStock(product);
  const discountBadge = CatalogueDiscountUtils.pickProductDiscountBadge(product);
  const isBundle = BundleUtils.isProductBundle(product);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block touch-manipulation active:scale-[0.98] transition-transform duration-150"
    >
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.thumbnailUrl || primaryImage.imageUrl}
              alt={primaryImage.altText || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
              className="object-cover sf-img-zoom"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-xs">{translations.noImageAvailable}</span>
            </div>
          )}

          {(discountBadge || isBundle) && (
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

          {/* Out of stock badge */}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-black">
                {translations.outOfStock}
              </span>
            </div>
          )}
        </div>

        <div className="p-2 sm:p-2.5 space-y-0.5">
          <PriceDisplay
            product={product}
            currency={currency}
            locale={locale}
            effectiveClassName="text-sm font-semibold"
          />
          <h3 className="line-clamp-2 text-xs text-muted-foreground leading-snug">
            {product.name}
          </h3>
        </div>
      </div>
    </Link>
  );
}
