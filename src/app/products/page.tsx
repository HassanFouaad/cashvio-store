import { SearchInput } from "@/components/common/search-input";
import { getProductsWithErrorHandling } from "@/features/products/api/get-products";
import { ProductsFilterBar } from "@/features/products/components/products-filter-bar";
import { ProductsGrid } from "@/features/products/components/products-grid";
import { ProductSortBy } from "@/features/products/types/product.types";
import { getStoreByCode } from "@/features/store/api/get-store";
import { getStoreCode } from "@/features/store/utils/store-resolver";
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
  const code = getStoreCode(hostname);

  if (!code) {
    return {
      title: "Products",
      description: "Browse products",
    };
  }

  const store = await getStoreByCode(code);

  return {
    title: `Products - ${store.name}`,
    description: `Browse all products at ${store.name}`,
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const code = getStoreCode(hostname);

  if (!code) {
    throw new Error("Invalid store subdomain");
  }

  const resolvedSearchParams = await searchParams;
  const store = await getStoreByCode(code);
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
    { search, sortBy, inStock: inStock ? "true" : undefined }
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

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <section className="w-full max-w-full bg-muted/30 py-8 sm:py-12 md:py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {t("store.products.pageTitle")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("store.products.pageDescription")}
            </p>

            {/* Search Input */}
            <div className="flex justify-center pt-2">
              <SearchInput
                placeholder={t("store.products.searchPlaceholder")}
                searchKey="search"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Products */}
      <section className="w-full max-w-full py-8 sm:py-12">
        <div className="container space-y-6">
          {/* Filter Bar */}
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
