import { StarRatingDisplay } from "@/features/products/components/star-rating";
import { PublicProductDto } from "@/features/products/types/product.types";
import {
  formatProductPrice,
  getPrimaryImage,
  isProductInStock,
  ProductCardTranslations,
} from "@/features/products/utils";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: PublicProductDto;
  currency: string;
  locale: string;
  translations: ProductCardTranslations;
}

/**
 * Product card component for grid display
 * Mobile-first, modern design similar to Shopify
 * Server component - no client-side hooks for SEO
 * Enhanced for native mobile touch interactions
 */
export function ProductCard({
  product,
  currency,
  locale,
  translations,
}: ProductCardProps) {
  // Use utility functions for cleaner code
  const primaryImage = getPrimaryImage(product);
  const inStock = isProductInStock(product);
  const priceDisplay = formatProductPrice(product, currency, locale);
  const reviewCount = product.reviewCount ?? 0;
  const hasRating = reviewCount > 0 && product.averageRating != null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block touch-manipulation active:scale-[0.98] transition-transform duration-150"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted mb-3 shadow-sm">
        {primaryImage ? (
          <Image
            src={primaryImage.thumbnailUrl || primaryImage.imageUrl}
            alt={primaryImage.altText || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-sm">{translations.noImageAvailable}</span>
          </div>
        )}

        {/* Out of stock badge */}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black shadow-sm">
              {translations.outOfStock}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 px-0.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight group-hover:text-primary group-active:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Aggregate review stars — displayed reviews only */}
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

        {priceDisplay && (
          <p className="text-sm font-bold text-foreground">{priceDisplay}</p>
        )}
      </div>
    </Link>
  );
}
