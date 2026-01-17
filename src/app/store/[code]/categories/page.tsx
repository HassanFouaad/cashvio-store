import { Metadata } from 'next';
import { getStoreByCode } from '@/features/store/api/get-store';
import { getCategoriesWithErrorHandling } from '@/features/categories/api/get-categories';
import { CategoriesGrid } from '@/features/categories/components/categories-grid';
import { SearchInput } from '@/components/common/search-input';
import { getTranslations } from 'next-intl/server';
import { parsePage } from '@/lib/utils/query-params';
import { validatePaginationAndRedirect } from '@/lib/utils/pagination-redirect';

interface CategoriesPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  // This is cached - shares cache with layout's generateMetadata
  const store = await getStoreByCode(code);

  return {
    title: `Categories - ${store.name}`,
    description: `Browse all categories at ${store.name}`,
  };
}

export default async function CategoriesPage({
  params,
  searchParams,
}: CategoriesPageProps) {
  const { code } = await params;
  const resolvedSearchParams = await searchParams;
  // This is cached - won't make additional API call since layout already fetched it
  const store = await getStoreByCode(code);
  const t = await getTranslations();

  // Safely parse page number (defaults to 1 if invalid/malformed)
  const requestedPage = parsePage(resolvedSearchParams.page, 1);
  const search = resolvedSearchParams.search || '';

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
    `/store/${code}/categories`,
    { search }
  );

  if (error || !categoriesData) {
    return (
      <div className="w-full max-w-full py-12 sm:py-16">
        <div className="container">
          <div className="text-center space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t('errors.generic')}
            </h1>
            <p className="text-muted-foreground">
              {t('errors.categories.loadFailed')}
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
              {t('store.categories.pageTitle')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('store.categories.pageDescription')}
            </p>
            
            {/* Search Input */}
            <div className="flex justify-center pt-2">
              <SearchInput
                placeholder={t('store.categories.searchPlaceholder')}
                searchKey="search"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="w-full max-w-full py-8 sm:py-12">
        <div className="container">
          <CategoriesGrid
            categories={categoriesData.items}
            storeCode={code}
            pagination={categoriesData.pagination}
          />
        </div>
      </section>
    </div>
  );
}
