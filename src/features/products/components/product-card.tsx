import { DiscountBadge } from "@/features/products/components/discount-badge";
import { BundleBadge } from "@/features/products/components/bundle-badge";
import { PriceDisplay } from "@/features/products/components/price-display";
import { ProductCardMinimal } from "@/features/products/components/product-card-minimal";
import { ProductCardOverlay } from "@/features/products/components/product-card-overlay";
import { ProductCardTile } from "@/features/products/components/product-card-tile";
import { StarRatingDisplay } from "@/features/products/components/star-rating";
import { PublicProductDto } from "@/features/products/types/product.types";
import {
  CatalogueDiscountUtils,
} from "@/features/products/utils/catalogue-discount.utils";
import { BundleUtils } from "@/features/products/utils/bundle.utils";
import {
  getPrimaryImage,
  isProductInStock,
  ProductCardTranslations,
} from "@/features/products/utils";
import { StoreFrontThemeProductCardVariant } from "@/features/store/types/store.types";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: PublicProductDto;
  currency: string;
  locale: string;
  translations: ProductCardTranslations;
  /** Theme card style — defaults to STANDARD (the pre-theme-engine card) */
  variant?: StoreFrontThemeProductCardVariant;
}

/**
 * Theme-aware product card. STANDARD renders the storefront's original
 * card; OVERLAY and MINIMAL are theme variants. Server component - no
 * client-side hooks for SEO.
 */
export function ProductCard({
  product,
  currency,
  locale,
  translations,
  variant = StoreFrontThemeProductCardVariant.STANDARD,
}: ProductCardProps) {
  if (variant === StoreFrontThemeProductCardVariant.OVERLAY) {
    return (
      <ProductCardOverlay
        product={product}
        currency={currency}
        locale={locale}
        translations={translations}
      />
    );
  }

  if (variant === StoreFrontThemeProductCardVariant.MINIMAL) {
    return (
      <ProductCardMinimal
        product={product}
        currency={currency}
        locale={locale}
        translations={translations}
      />
    );
  }

  if (variant === StoreFrontThemeProductCardVariant.TILE) {
    return (
      <ProductCardTile
        product={product}
        currency={currency}
        locale={locale}
        translations={translations}
      />
    );
  }

  // STANDARD — the storefront's original card
  const primaryImage = getPrimaryImage(product);
  const inStock = isProductInStock(product);
  const discountBadge = CatalogueDiscountUtils.pickProductDiscountBadge(product);
  const isBundle = BundleUtils.isProductBundle(product);
  const reviewCount = product.reviewCount ?? 0;
  const hasRating = reviewCount > 0 && product.averageRating != null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block touch-manipulation active:scale-[0.98] transition-transform duration-150"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted mb-3">
        {primaryImage ? (
          <Image
            src={primaryImage.thumbnailUrl || primaryImage.imageUrl}
            alt={primaryImage.altText || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover sf-img-zoom"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-sm">{translations.noImageAvailable}</span>
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

        <PriceDisplay
          product={product}
          currency={currency}
          locale={locale}
          effectiveClassName="text-sm font-semibold"
        />
      </div>
    </Link>
  );
}
