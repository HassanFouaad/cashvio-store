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

interface ProductCardMinimalProps {
  product: PublicProductDto;
  currency: string;
  locale: string;
  translations: ProductCardTranslations;
}

/**
 * MINIMAL product card — editorial, whitespace-first: square-edged tall
 * imagery, uppercase micro-title, understated price.
 */
export function ProductCardMinimal({
  product,
  currency,
  locale,
  translations,
}: ProductCardMinimalProps) {
  const primaryImage = getPrimaryImage(product);
  const inStock = isProductInStock(product);
  const priceDisplay = formatProductPrice(product, currency, locale);
  const reviewCount = product.reviewCount ?? 0;
  const hasRating = reviewCount > 0 && product.averageRating != null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block touch-manipulation active:scale-[0.99] transition-transform duration-150"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-3">
        {primaryImage ? (
          <Image
            src={primaryImage.thumbnailUrl || primaryImage.imageUrl}
            alt={primaryImage.altText || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-sm">{translations.noImageAvailable}</span>
          </div>
        )}

        {/* Out of stock badge */}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
            <span className="bg-white px-3 py-1.5 text-xs font-medium text-black">
              {translations.outOfStock}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="line-clamp-2 text-xs sm:text-sm font-medium uppercase tracking-[0.08em] leading-snug group-hover:text-primary transition-colors">
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
        {priceDisplay && (
          <p className="text-sm text-muted-foreground">{priceDisplay}</p>
        )}
      </div>
    </Link>
  );
}
