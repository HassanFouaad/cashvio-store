import { PaginationControls } from "@/components/common/pagination-controls";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/features/categories/components/category-card";
import { PublicCategoryDto } from "@/features/categories/types/category.types";
import { PaginationMeta } from "@/lib/api/types";
import { normalizePagination } from "@/lib/utils/pagination";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

interface CategoriesGridProps {
  categories: PublicCategoryDto[];
  pagination: PaginationMeta;
}

/**
 * Server-side rendered categories grid
 * Only pagination controls are client-side
 */
export async function CategoriesGrid({
  categories,
  pagination,
}: CategoriesGridProps) {
  const t = await getTranslations("store.categories");

  // Normalize pagination to ensure consistent number handling
  const normalizedPagination = normalizePagination(pagination);

  // Show empty state if no categories at all
  if (!categories || categories.length === 0) {
    // If we're on page > 1 and no results, show "no results on this page"
    if (normalizedPagination.page > 1) {
      return (
        <div className="text-center py-12 space-y-4">
          <p className="text-lg text-muted-foreground">
            {t("noResultsOnPage")}
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link href="/categories">
              <Button variant="default">{t("backToFirstPage")}</Button>
            </Link>
            <PaginationControls
              pagination={normalizedPagination}
              baseUrl="/categories"
            />
          </div>
        </div>
      );
    }

    // No categories at all
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-lg text-muted-foreground">{t("noCategories")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Categories Grid - SSR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* Pagination Controls - Client Component */}
      <PaginationControls
        pagination={normalizedPagination}
        baseUrl="/categories"
      />
    </div>
  );
}
