import { SafeHtmlRenderer } from "@/components/ui/safe-html-renderer";
import { getCategoryByIdWithErrorHandling } from "@/features/categories/api/get-categories";
import { getProductsWithErrorHandling } from "@/features/products/api/get-products";
import { ProductsFilterBar } from "@/features/products/components/products-filter-bar";
import { ProductsGrid } from "@/features/products/components/products-grid";
import { ProductSortBy } from "@/features/products/types/product.types";
import { getStoreBySubdomain } from "@/features/store/api/get-store";
import { getStoreSubdomain } from "@/features/store/utils/store-resolver";
import { validatePaginationAndRedirect } from "@/lib/utils/pagination-redirect";
import { parsePage } from "@/lib/utils/query-params";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CategoryDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: ProductSortBy;
    inStock?: string;
  }>;
}

export async function generateMetadata({
  params,
}: CategoryDetailPageProps): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeSubdomain = getStoreSubdomain(hostname);
  const resolvedParams = await params;
  const t = await getTranslations("metadata.categoryDetail");

  if (!storeSubdomain) {
    return {
      title: t("title"),
      description: t("description"),
    };
  }

  const store = await getStoreBySubdomain(storeSubdomain);
  const { category } = await getCategoryByIdWithErrorHandling(
    resolvedParams.id,
    store.tenantId,
  );

  return {
    title: category
      ? t("titleWithStore", {
          categoryName: category.name,
          storeName: store.name,
        })
      : t("title"),
    description: category
      ? t("descriptionWithStore", {
          categoryName: category.name,
          storeName: store.name,
        })
      : t("description"),
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeSubdomain = getStoreSubdomain(hostname);

  if (!storeSubdomain) {
    throw new Error("Invalid store subdomain");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const store = await getStoreBySubdomain(storeSubdomain);
  const t = await getTranslations();

  // Fetch category details
  const { category, error: categoryError } =
    await getCategoryByIdWithErrorHandling(resolvedParams.id, store.tenantId);

  if (categoryError || !category) {
    notFound();
  }

  // Parse query params
  const requestedPage = parsePage(resolvedSearchParams.page, 1);
  const search = resolvedSearchParams.search || "";
  const sortBy = resolvedSearchParams.sortBy || ProductSortBy.CREATED_AT;
  const inStock = resolvedSearchParams.inStock === "true";

  // Fetch products for this category
  const { products: productsData, error: productsError } =
    await getProductsWithErrorHandling({
      storeId: store.id,
      tenantId: store.tenantId,
      categoryId: resolvedParams.id,
      page: requestedPage,
      limit: 18,
      name: search || undefined,
      sortBy,
      inStock: inStock || undefined,
    });

  const baseUrl = `/categories/${resolvedParams.id}`;

  // Validate pagination and redirect if out of range
  validatePaginationAndRedirect(
    productsData?.pagination,
    requestedPage,
    baseUrl,
    {
      search,
      sortBy,
      inStock: inStock ? "true" : undefined,
    },
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Category Header */}
      <section className="w-full max-w-full bg-muted/30 py-6 sm:py-8 md:py-12">
        <div className="container">
          {/* Back Link */}
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            {t("store.categories.backToCollections")}
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Category Image */}
            {category.imageUrl && (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Category Info */}
            <div className="text-center sm:text-start">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                {category.name}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Category Description Section - Separate for better UI/UX */}
      {category.description && (
        <section className="w-full max-w-full py-4 sm:py-6 border-b">
          <div className="container">
            <SafeHtmlRenderer
              html={category.description}
              className="prose prose-sm sm:prose max-w-none"
            />
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="w-full max-w-full py-6 sm:py-8">
        <div className="container space-y-6">
          {/* Filter Bar with Search */}
          <ProductsFilterBar
            currentSort={sortBy}
            inStockOnly={inStock}
            totalItems={productsData?.pagination?.totalItems}
          />

          {/* Products Grid or Error */}
          {productsError || !productsData ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-lg text-muted-foreground">
                {t("errors.products.loadFailed")}
              </p>
            </div>
          ) : (
            <ProductsGrid
              products={productsData.items}
              pagination={productsData.pagination}
              currency={store.currency}
              baseUrl={baseUrl}
            />
          )}
        </div>
      </section>
    </div>
  );
}
