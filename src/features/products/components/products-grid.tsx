import { PaginationControls } from "@/components/common/pagination-controls";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/products/components/product-card";
import { PublicProductDto } from "@/features/products/types/product.types";
import { ProductCardTranslations } from "@/features/products/utils";
import { PaginationMeta } from "@/lib/api/types";
import { normalizePagination } from "@/lib/utils/pagination";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
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
  const t = await getTranslations("store.products");
  const locale = await getLocale();

  // Get translations for ProductCard
  const productTranslations: ProductCardTranslations = {
    noImageAvailable: t("noImageAvailable"),
    outOfStock: t("outOfStock"),
  };

  // Normalize pagination to ensure consistent number handling
  const normalizedPagination = normalizePagination(pagination);

  // Show empty state if no products at all
  if (!products || products.length === 0) {
    // If we're on page > 1 and no results, show "no results on this page"
    if (normalizedPagination.page > 1) {
      return (
        <div className="text-center py-12 space-y-4">
          <p className="text-lg text-muted-foreground">
            {t("noResultsOnPage")}
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link href={baseUrl}>
              <Button variant="default">{t("backToFirstPage")}</Button>
            </Link>
            <Suspense fallback={null}>
              <PaginationControls
                pagination={normalizedPagination}
                baseUrl={baseUrl}
              />
            </Suspense>
          </div>
        </div>
      );
    }

    // No products at all
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-lg text-muted-foreground">{t("noProducts")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Products Grid - SSR - Mobile-optimized gaps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={currency}
            locale={locale}
            translations={productTranslations}
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
