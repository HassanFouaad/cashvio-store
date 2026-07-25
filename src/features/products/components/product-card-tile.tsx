import { PublicProductDto } from "@/features/products/types/product.types";
import {
  formatProductPrice,
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
  const priceDisplay = formatProductPrice(product, currency, locale);

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
          {priceDisplay && (
            <p className="sf-price text-sm font-semibold tabular-nums text-foreground">
              {priceDisplay}
            </p>
          )}
          <h3 className="line-clamp-2 text-xs text-muted-foreground leading-snug">
            {product.name}
          </h3>
        </div>
      </div>
    </Link>
  );
}
