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

interface ProductCardOverlayProps {
  product: PublicProductDto;
  currency: string;
  locale: string;
  translations: ProductCardTranslations;
}

/**
 * OVERLAY product card — full-image tile with the product info laid over
 * a bottom gradient. Bold, immersive feel (tech/premium themes).
 */
export function ProductCardOverlay({
  product,
  currency,
  locale,
  translations,
}: ProductCardOverlayProps) {
  const primaryImage = getPrimaryImage(product);
  const inStock = isProductInStock(product);
  const priceDisplay = formatProductPrice(product, currency, locale);
  const reviewCount = product.reviewCount ?? 0;
  const hasRating = reviewCount > 0 && product.averageRating != null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-muted touch-manipulation active:scale-[0.98] transition-transform duration-150"
    >
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

      {/* Legibility gradient + product info */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-12 space-y-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">
          {product.name}
        </h3>
        {hasRating && (
          <div className="flex items-center gap-1">
            <StarRatingDisplay
              rating={Math.round(product.averageRating ?? 0)}
              size="sm"
            />
            <span className="text-xs text-white/75">({reviewCount})</span>
          </div>
        )}
        {priceDisplay && (
          <p className="text-sm font-bold text-white">{priceDisplay}</p>
        )}
      </div>

      {/* Out of stock badge */}
      {!inStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black shadow-sm">
            {translations.outOfStock}
          </span>
        </div>
      )}
    </Link>
  );
}
