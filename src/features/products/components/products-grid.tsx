import { PaginationControls } from "@/components/common/pagination-controls";
import { ProductCard } from "@/features/products/components/product-card";
import { ProductsFeedback } from "@/features/products/components/products-feedback";
import { ProductResultsStatus } from "@/features/products/types/product-results.types";
import { PublicProductDto } from "@/features/products/types/product.types";
import { ProductCardTranslations } from "@/features/products/utils";
import { PaginationMeta } from "@/lib/api/types";
import { getThemePersonality, resolveRequestTheme } from "@/lib/theme";
import { normalizePagination } from "@/lib/utils/pagination";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

interface ProductsGridProps {
  products: PublicProductDto[];
  pagination: PaginationMeta;
  currency: string;
  baseUrl?: string;
}

/**
 * Server-side rendered products grid with pagination
 * Reusable across products list page and category detail page
 */
export async function ProductsGrid({
  products,
  pagination,
  currency,
  baseUrl = "/products",
}: ProductsGridProps) {
  const [t, locale, resolvedTheme] = await Promise.all([
    getTranslations("store.products"),
    getLocale(),
    resolveRequestTheme(),
  ]);
  const personality = getThemePersonality(resolvedTheme.layout);

  // Get translations for ProductCard
  const productTranslations: ProductCardTranslations = {
    noImageAvailable: t("noImageAvailable"),
    outOfStock: t("outOfStock"),
  };

  // Normalize pagination to ensure consistent number handling
  const normalizedPagination = normalizePagination(pagination);

  if (products.length === 0) {
    return (
      <Suspense
        fallback={
          <div
            className="h-52 animate-pulse rounded-xl bg-muted"
            aria-hidden="true"
          />
        }
      >
        <ProductsFeedback
          baseUrl={baseUrl}
          status={
            normalizedPagination.page > 1
              ? ProductResultsStatus.EMPTY_PAGE
              : ProductResultsStatus.EMPTY
          }
        />
      </Suspense>
    );
  }

  return (
    <div className="space-y-8">
      {/* Products Grid - SSR - density follows the theme personality */}
      <div className={personality.listingGrid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={currency}
            locale={locale}
            translations={productTranslations}
            variant={resolvedTheme.layout.productCard}
          />
        ))}
      </div>

      {/* Pagination Controls - Client Component wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <PaginationControls
          pagination={normalizedPagination}
          baseUrl={baseUrl}
        />
      </Suspense>
    </div>
  );
}
