import { SafeHtmlRenderer } from "@/components/ui/safe-html-renderer";
import {
  PaginatedReviewsResponse,
  PublicProductDto,
} from "@/features/products/types/product.types";
import { sortProductImages } from "@/features/products/utils/product-helpers";
import { StoreFrontThemeProductPageVariant } from "@/features/store/types/store.types";
import { resolveRequestTheme } from "@/lib/theme";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AddToCartSection } from "./add-to-cart-section";
import { ProductImageGallery } from "./product-image-gallery";
import { ProductReviews } from "./product-reviews";
import { ProductShareButtons } from "./product-share-buttons";

interface ProductDetailsProps {
  product: PublicProductDto;
  currency: string;
  locale: string;
  storeId: string;
  reviews: PaginatedReviewsResponse | null;
  productUrl: string;
}

/**
 * Product details - Server Component
 * Renders all SEO-critical content server-side, mobile-first.
 *
 * The page STRUCTURE is a theme axis (layout.productPage):
 * - CLASSIC: two-column 7/5 grid, sticky gallery (the original layout)
 * - GALLERY: image-first 8/4 grid with a sticky compact buy panel
 * - STACKED: single centered editorial column, title above the gallery
 */
export async function ProductDetails({
  product,
  currency,
  locale,
  storeId,
  reviews,
  productUrl,
}: ProductDetailsProps) {
  const t = await getTranslations("store.products");
  const resolvedTheme = await resolveRequestTheme();
  const variant = resolvedTheme.layout.productPage;

  // Server-side data preparation
  const sortedImages = sortProductImages(product.images);

  const breadcrumb = (
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
  );

  const gallery = (
    <ProductImageGallery
      images={sortedImages}
      productName={product.name}
      noImageText={t("noImageAvailable")}
    />
  );

  const buyPanel = (
    <>
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

      {/* Divider */}
      <hr className="border-border" />

      {/* Share - WhatsApp / Facebook / copy link */}
      <ProductShareButtons
        productName={product.name}
        productUrl={productUrl}
      />
    </>
  );

  const description = product.description && (
    <section
      className={`mt-10 sm:mt-14 pt-8 sm:pt-10 border-t border-border ${
        variant === StoreFrontThemeProductPageVariant.STACKED
          ? "max-w-2xl mx-auto"
          : ""
      }`}
    >
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
  );

  if (variant === StoreFrontThemeProductPageVariant.STACKED) {
    return (
      <div className="w-full">
        {breadcrumb}

        {/* Single centered editorial column: title above the gallery */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-tight text-center">
            {product.name}
          </h1>
          {gallery}
          <div className="space-y-5">{buyPanel}</div>
        </div>

        {description}
        <ProductReviews productId={product.id} reviews={reviews} />
      </div>
    );
  }

  if (variant === StoreFrontThemeProductPageVariant.GALLERY) {
    return (
      <div className="w-full">
        {breadcrumb}

        {/* Image-first: large scrolling gallery + sticky compact buy panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-8">{gallery}</div>
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-4 space-y-5">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-tight">
                {product.name}
              </h1>
              <hr className="border-border" />
              {buyPanel}
            </div>
          </div>
        </div>

        {description}
        <ProductReviews productId={product.id} reviews={reviews} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {breadcrumb}

      {/* Main Product Section - Shopify Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
        {/* Left Column - Product Images (7 cols on desktop) */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-4">{gallery}</div>
        </div>

        {/* Right Column - Product Info (5 cols on desktop) */}
        <div className="lg:col-span-5">
          <div className="space-y-5">
            {/* Product Title */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Divider */}
            <hr className="border-border" />

            {buyPanel}
          </div>
        </div>
      </div>

      {description}

      {/* Product Reviews Section */}
      <ProductReviews productId={product.id} reviews={reviews} />
    </div>
  );
}
