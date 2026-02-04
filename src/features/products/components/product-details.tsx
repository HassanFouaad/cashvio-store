import { PublicProductDto } from "@/features/products/types/product.types";
import { sortProductImages } from "@/features/products/utils/product-helpers";
import { formatCurrency } from "@/lib/utils/formatters";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AddToCartSection } from "./add-to-cart-section";
import { ProductImageGallery } from "./product-image-gallery";

interface ProductDetailsProps {
  product: PublicProductDto;
  currency: string;
  locale: string;
  storeId: string;
}

/**
 * Product details - Server Component
 * Renders all SEO-critical content server-side
 * Only interactive parts (cart, gallery) are client components
 */
export async function ProductDetails({
  product,
  currency,
  locale,
  storeId,
}: ProductDetailsProps) {
  const t = await getTranslations("store.products");

  // Server-side data preparation
  const sortedImages = sortProductImages(product.images);
  const defaultVariant = product.variants?.[0];

  // Get stock status from default variant for initial SSR
  const isInStock = defaultVariant?.inStock ?? false;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back button - SEO friendly navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        {t("backToStore")}
      </Link>

      {/* Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        {/* Left Column - Images (Client for interactivity) */}
        <ProductImageGallery
          images={sortedImages}
          productName={product.name}
          noImageText={t("noImageAvailable")}
        />

        {/* Right Column - Product Info (Server rendered for SEO) */}
        <div className="space-y-6">
          {/* Product Title - Critical SEO content */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>

            {/* Price display - Server rendered for SEO */}
            {defaultVariant && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold">
                  {formatCurrency(defaultVariant.sellingPrice, currency, locale)}
                </span>
                {product.taxIncluded && product.taxRate && (
                  <span className="text-sm text-muted-foreground">
                    ({t("taxIncluded")})
                  </span>
                )}
              </div>
            )}

            {/* Stock Status - Server rendered */}
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isInStock ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  isInStock
                    ? "text-green-600 dark:text-green-500"
                    : "text-red-600 dark:text-red-500"
                }`}
              >
                {isInStock ? t("inStock") : t("outOfStock")}
              </span>
              {/* Low stock warning */}
              {isInStock &&
                defaultVariant &&
                defaultVariant.availableQuantity < 5 && (
                  <span className="text-sm font-medium text-destructive">
                    ({defaultVariant.availableQuantity} {t("leftInStock")})
                  </span>
                )}
            </div>
          </div>

          {/* Description - Critical SEO content */}
          {product.description && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{t("description")}</h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* Cart Section - Client component for interactivity */}
          {product.variants && product.variants.length > 0 && (
            <AddToCartSection
              product={product}
              variants={product.variants}
              currency={currency}
              locale={locale}
              storeId={storeId}
            />
          )}

          {/* Tags - Server rendered for SEO */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
