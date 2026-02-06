import { SafeHtmlRenderer } from "@/components/ui/safe-html-renderer";
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
 * Shopify-inspired design with clean layout
 * Renders all SEO-critical content server-side
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
    <div className="w-full">
      {/* Breadcrumb Navigation */}
      <nav className="mb-4 sm:mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          <span>{t("backToStore")}</span>
        </Link>
      </nav>

      {/* Main Product Section - Shopify Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Left Column - Product Images (7 cols on desktop) */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-4">
            <ProductImageGallery
              images={sortedImages}
              productName={product.name}
              noImageText={t("noImageAvailable")}
            />
          </div>
        </div>

        {/* Right Column - Product Info (5 cols on desktop) */}
        <div className="lg:col-span-5">
          <div className="space-y-6">
            {/* Product Title & Price */}
            <div className="space-y-3">
              {/* Product Name */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
                {product.name}
              </h1>

              {/* Price */}
              {defaultVariant && (
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-semibold">
                    {formatCurrency(
                      defaultVariant.sellingPrice,
                      currency,
                      locale,
                    )}
                  </span>
                  {product.taxIncluded && product.taxRate && (
                    <span className="text-sm text-muted-foreground">
                      {t("taxIncluded")}
                    </span>
                  )}
                </div>
              )}

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {isInStock ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-500">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      {t("inStock")}
                    </span>
                    {product.inventoryTrackable &&
                      defaultVariant &&
                      defaultVariant.availableQuantity > 0 &&
                      defaultVariant.availableQuantity < 5 && (
                        <span className="text-sm text-amber-600 dark:text-amber-500">
                          —{" "}
                          {t("leftInStock", {
                            count: defaultVariant.availableQuantity,
                          })}
                        </span>
                      )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-500">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {t("outOfStock")}
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <hr className="border-border" />

            {/* Add to Cart Section */}
            {product.variants && product.variants.length > 0 && (
              <AddToCartSection
                product={product}
                variants={product.variants}
                currency={currency}
                locale={locale}
                storeId={storeId}
              />
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Description - Full Width Section Below */}
      {product.description && (
        <section className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-border">
          <div className="max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6">
              {t("description")}
            </h2>
            <SafeHtmlRenderer
              html={product.description}
              className="safe-html-content text-base leading-relaxed"
            />
          </div>
        </section>
      )}
    </div>
  );
}
