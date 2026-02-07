import { SearchInput } from "@/components/common/search-input";
import { getCategoriesWithErrorHandling } from "@/features/categories/api/get-categories";
import { CategoriesGrid } from "@/features/categories/components/categories-grid";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { validatePaginationAndRedirect } from "@/lib/utils/pagination-redirect";
import { parsePage } from "@/lib/utils/query-params";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

interface CategoriesPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.categories");

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
  };
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  // Resolve store and set API context (critical for X-Store-Id header)
  const { store, subdomain } = await resolveRequestStore();

  if (!subdomain || !store) {
    throw new Error("Invalid store subdomain");
  }

  const resolvedSearchParams = await searchParams;
  const t = await getTranslations();

  // Safely parse page number (defaults to 1 if invalid/malformed)
  const requestedPage = parsePage(resolvedSearchParams.page, 1);
  const search = resolvedSearchParams.search || "";

  const { categories: categoriesData, error } =
    await getCategoriesWithErrorHandling({
      tenantId: store.tenantId,
      page: requestedPage,
      limit: 12,
      name: search || undefined,
    });

  // Validate pagination and redirect if out of range
  validatePaginationAndRedirect(
    categoriesData?.pagination,
    requestedPage,
    `/categories`,
    { search },
  );

  if (error || !categoriesData) {
    return (
      <div className="w-full max-w-full py-12 sm:py-16">
        <div className="container">
          <div className="text-center space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t("errors.generic")}
            </h1>
            <p className="text-muted-foreground">
              {t("errors.categories.loadFailed")}
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
              {t("store.categories.pageTitle")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("store.categories.pageDescription")}
            </p>

            {/* Search Input - wrapped in Suspense for useSearchParams */}
            <Suspense fallback={null}>
              <div className="flex justify-center pt-2">
                <SearchInput
                  placeholder={t("store.categories.searchPlaceholder")}
                  searchKey="search"
                />
              </div>
            </Suspense>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="w-full max-w-full py-8 sm:py-12">
        <div className="container">
          <CategoriesGrid
            categories={categoriesData.items}
            pagination={categoriesData.pagination}
          />
        </div>
      </section>
    </div>
  );
}
