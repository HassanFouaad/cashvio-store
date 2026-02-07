import { SafeHtmlRenderer } from "@/components/ui/safe-html-renderer";
import { PublicProductDto } from "@/features/products/types/product.types";
import { sortProductImages } from "@/features/products/utils/product-helpers";
import { ChevronRight } from "lucide-react";
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
 * Mobile-first with proper visual hierarchy
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

  return (
    <div className="w-full">
      {/* Breadcrumb Navigation - Accessible with proper ARIA */}
      <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              {t("backToStore")}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </li>
          <li
            className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none"
            aria-current="page"
          >
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main Product Section - Shopify Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
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
          <div className="space-y-5">
            {/* Product Title}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Divider */}
            <hr className="border-border" />

            {/* Add to Cart Section - Variants, Price, Stock, Buttons */}
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
                      className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
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
        <section className="mt-10 sm:mt-14 pt-8 sm:pt-10 border-t border-border">
          <div className="max-w-3xl">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-foreground">
              {t("description")}
            </h2>
            <SafeHtmlRenderer
              html={product.description}
              className="safe-html-content text-base leading-relaxed text-muted-foreground"
            />
          </div>
        </section>
      )}
    </div>
  );
}
