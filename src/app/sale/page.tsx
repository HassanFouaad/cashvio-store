import { getProductsWithErrorHandling } from "@/features/products/api/get-products";
import { ProductsFilterBar } from "@/features/products/components/products-filter-bar";
import { ProductsGrid } from "@/features/products/components/products-grid";
import { ProductSortBy } from "@/features/products/types/product.types";
import { TrackViewItemList } from "@/lib/analytics/track-event";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { getThemePersonality, resolveRequestTheme } from "@/lib/theme";
import { validatePaginationAndRedirect } from "@/lib/utils/pagination-redirect";
import { parsePage } from "@/lib/utils/query-params";
import { buildLanguageAlternates } from "@/lib/utils/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

interface SalePageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: ProductSortBy;
    inStock?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.sale");
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
    alternates: {
      canonical: "/sale",
      languages: buildLanguageAlternates("/sale"),
    },
  };
}

export default async function SalePage({ searchParams }: SalePageProps) {
  const { store, subdomain } = await resolveRequestStore();

  if (!subdomain || !store) {
    throw new Error("Invalid store subdomain");
  }

  const resolvedSearchParams = await searchParams;
  const t = await getTranslations();

  const requestedPage = parsePage(resolvedSearchParams.page, 1);
  const search = resolvedSearchParams.search || "";
  const sortBy = resolvedSearchParams.sortBy || ProductSortBy.CREATED_AT;
  const inStock = resolvedSearchParams.inStock === "true";

  const [{ products: productsData, error }, resolvedTheme] = await Promise.all([
    getProductsWithErrorHandling({
      hasDiscount: true,
      page: requestedPage,
      limit: 18,
      name: search || undefined,
      sortBy,
      inStock: inStock || undefined,
    }),
    resolveRequestTheme(),
  ]);

  validatePaginationAndRedirect(
    productsData?.pagination,
    requestedPage,
    "/sale",
    {
      search,
      sortBy,
      inStock: inStock ? "true" : undefined,
    },
  );

  if (error || !productsData) {
    return (
      <div className="w-full max-w-full py-12 sm:py-16">
        <div className="container">
          <div className="text-center space-y-4">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {t("errors.generic")}
            </h1>
            <p className="text-muted-foreground">
              {t("errors.products.loadFailed")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const analyticsItems = productsData.items.map((product) => ({
    item_id: product.id,
    item_name: product.name,
    price: product.variants?.[0]?.sellingPrice ?? 0,
    quantity: 1,
  }));

  const personality = getThemePersonality(resolvedTheme.layout);
  const hasSaleProducts = productsData.pagination.totalItems > 0;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <TrackViewItemList
        listId="sale"
        listName="Sale"
        items={analyticsItems}
      />
      <section className={`w-full max-w-full ${personality.band}`}>
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <h1 className={personality.bandTitle}>{t("store.sale.pageTitle")}</h1>
            <p className={personality.bandSubtitle}>
              {t("store.sale.pageDescription")}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
        <div className="container space-y-6">
          {hasSaleProducts ? (
            <>
              <Suspense fallback={null}>
                <ProductsFilterBar
                  currentSort={sortBy}
                  inStockOnly={inStock}
                  totalItems={productsData.pagination.totalItems}
                  categories={[]}
                  currentCategoryId=""
                />
              </Suspense>

              <ProductsGrid
                products={productsData.items}
                pagination={productsData.pagination}
                currency={store.currency}
                baseUrl="/sale"
              />
            </>
          ) : (
            <div className="py-16 text-center space-y-3">
              <p className="text-lg font-medium">{t("store.sale.emptyTitle")}</p>
              <p className="text-muted-foreground">
                {t("store.sale.emptyDescription")}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
