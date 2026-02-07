import { getProductsWithErrorHandling } from "@/features/products/api/get-products";
import { ProductsFilterBar } from "@/features/products/components/products-filter-bar";
import { ProductsGrid } from "@/features/products/components/products-grid";
import { ProductSortBy } from "@/features/products/types/product.types";
import { getStoreBySubdomain } from "@/features/store/api/get-store";
import { getStoreSubdomain } from "@/features/store/utils/store-resolver";
import { TrackViewItemList } from "@/lib/analytics/track-event";
import { validatePaginationAndRedirect } from "@/lib/utils/pagination-redirect";
import { parsePage } from "@/lib/utils/query-params";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: ProductSortBy;
    inStock?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeSubdomain = getStoreSubdomain(hostname);
  const t = await getTranslations("metadata.products");

  if (!storeSubdomain) {
    return {
      title: t("title"),
      description: t("description"),
    };
  }

  const store = await getStoreBySubdomain(storeSubdomain);

  return {
    title: t("titleWithStore", { storeName: store.name }),
    description: t("descriptionWithStore", { storeName: store.name }),
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeSubdomain = getStoreSubdomain(hostname);

  if (!storeSubdomain) {
    throw new Error("Invalid store subdomain");
  }

  const resolvedSearchParams = await searchParams;
  const store = await getStoreBySubdomain(storeSubdomain);
  const t = await getTranslations();

  // Parse query params
  const requestedPage = parsePage(resolvedSearchParams.page, 1);
  const search = resolvedSearchParams.search || "";
  const sortBy = resolvedSearchParams.sortBy || ProductSortBy.CREATED_AT;
  const inStock = resolvedSearchParams.inStock === "true";

  const { products: productsData, error } = await getProductsWithErrorHandling({
    storeId: store.id,
    tenantId: store.tenantId,
    page: requestedPage,
    limit: 18,
    name: search || undefined,
    sortBy,
    inStock: inStock || undefined,
  });

  // Validate pagination and redirect if out of range
  validatePaginationAndRedirect(
    productsData?.pagination,
    requestedPage,
    `/products`,
    { search, sortBy, inStock: inStock ? "true" : undefined },
  );

  if (error || !productsData) {
    return (
      <div className="w-full max-w-full py-12 sm:py-16">
        <div className="container">
          <div className="text-center space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold">
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

  // Prepare analytics items for view_item_list event
  const analyticsItems = productsData.items.map((p) => ({
    item_id: p.id,
    item_name: p.name,
    price: p.variants?.[0]?.sellingPrice ?? 0,
    quantity: 1,
  }));

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <TrackViewItemList
        listId="products"
        listName="All Products"
        items={analyticsItems}
      />
      {/* Page Header */}
      <section className="w-full max-w-full bg-muted/30 py-6 sm:py-8 md:py-12">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {t("store.products.pageTitle")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("store.products.pageDescription")}
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Products */}
      <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
        <div className="container space-y-6">
          {/* Filter Bar with Search */}
          <ProductsFilterBar
            currentSort={sortBy}
            inStockOnly={inStock}
            totalItems={productsData.pagination.totalItems}
          />

          {/* Products Grid */}
          <ProductsGrid
            products={productsData.items}
            pagination={productsData.pagination}
            currency={store.currency}
            baseUrl="/products"
          />
        </div>
      </section>
    </div>
  );
}
