import { getCategoriesWithErrorHandling } from "@/features/categories/api/get-categories";
import { getProductsWithErrorHandling } from "@/features/products/api/get-products";
import { ProductsFilterBar } from "@/features/products/components/products-filter-bar";
import { ProductsGrid } from "@/features/products/components/products-grid";
import { ProductsFeedback } from "@/features/products/components/products-feedback";
import { ProductResultsStatus } from "@/features/products/types/product-results.types";
import { parseProductSort } from "@/features/products/utils/catalog-filters";
import { ProductSortBy } from "@/features/products/types/product.types";
import { TrackViewItemList } from "@/lib/analytics/track-event";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { getThemePersonality, resolveRequestTheme } from "@/lib/theme";
import { validatePaginationAndRedirect } from "@/lib/utils/pagination-redirect";
import { normalizeSearchParams, parsePage } from "@/lib/utils/query-params";
import { buildLanguageAlternates } from "@/lib/utils/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Max categories offered in the filter dropdown */
const CATEGORY_FILTER_LIMIT = 50;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.products");

  // Resolve store and set API context
  const { store } = await resolveRequestStore();

  if (!store) {
    return {
      title: t("title"),
      description: t("description"),
    };
  }

  return {
    title: t("titleWithStore", { storeName: store.name }),
    description: t("descriptionWithStore", { storeName: store.name }),
    // One canonical for all filter/sort/page permutations
    alternates: {
      canonical: "/products",
      languages: buildLanguageAlternates("/products"),
    },
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  // Resolve store and set API context (critical for X-Store-Id header)
  const { store, subdomain } = await resolveRequestStore();

  if (!subdomain || !store) {
    throw new Error("Invalid store subdomain");
  }

  const resolvedSearchParams = normalizeSearchParams(await searchParams);
  const t = await getTranslations();

  // Parse query params
  const requestedPage = parsePage(resolvedSearchParams.page, 1);
  const search = resolvedSearchParams.search?.trim() || "";
  const sortBy = parseProductSort(resolvedSearchParams.sortBy);
  const inStock = resolvedSearchParams.inStock === "true";
  const categoryId = resolvedSearchParams.categoryId || "";

  // Products + category options in parallel
  const [
    { products: productsData, error },
    { categories: categoriesData },
    resolvedTheme,
  ] = await Promise.all([
    getProductsWithErrorHandling({
      page: requestedPage,
      limit: 18,
      name: search || undefined,
      sortBy,
      inStock: inStock || undefined,
      categoryId: categoryId || undefined,
    }),
    getCategoriesWithErrorHandling({
      page: 1,
      limit: CATEGORY_FILTER_LIMIT,
    }),
    resolveRequestTheme(),
  ]);

  const categories = categoriesData?.items ?? [];

  // Validate pagination and redirect if out of range
  validatePaginationAndRedirect(
    productsData?.pagination,
    requestedPage,
    `/products`,
    {
      ...resolvedSearchParams,
      search: search || undefined,
      sortBy: sortBy === ProductSortBy.CREATED_AT ? undefined : sortBy,
      inStock: inStock ? "true" : undefined,
      categoryId: categoryId || undefined,
    },
  );

  // Failed reads keep their filters and do not emit an empty-list view event.
  const analyticsItems = (productsData?.items ?? []).map((p) => ({
    item_id: p.id,
    item_name: p.name,
    price: p.variants?.[0]?.sellingPrice ?? 0,
    quantity: 1,
  }));

  const personality = getThemePersonality(resolvedTheme.layout);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {!error && productsData && (
        <TrackViewItemList
          listId="products"
          listName="All Products"
          items={analyticsItems}
        />
      )}
      {/* Page Header - band treatment follows the theme personality */}
      <section className={`w-full max-w-full ${personality.band}`}>
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <h1 className={personality.bandTitle}>
              {t("store.products.pageTitle")}
            </h1>
            <p className={personality.bandSubtitle}>
              {t("store.products.pageDescription")}
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Products */}
      <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
        <div className="container space-y-6">
          {/* Filter Bar with Search - wrapped in Suspense for useSearchParams */}
          <Suspense fallback={null}>
            <ProductsFilterBar
              currentSort={sortBy}
              inStockOnly={inStock}
              totalItems={productsData?.pagination.totalItems}
              categories={categories.map((category) => ({
                id: category.id,
                name: category.name,
              }))}
              currentCategoryId={categoryId}
            />
          </Suspense>

          {/* Products Grid */}
          {error || !productsData ? (
            <Suspense
              fallback={
                <div
                  className="h-52 animate-pulse rounded-xl bg-muted"
                  aria-hidden="true"
                />
              }
            >
              <ProductsFeedback
                status={ProductResultsStatus.ERROR}
                baseUrl="/products"
              />
            </Suspense>
          ) : (
            <ProductsGrid
              products={productsData.items}
              pagination={productsData.pagination}
              currency={store.currency}
              baseUrl="/products"
            />
          )}
        </div>
      </section>
    </div>
  );
}
