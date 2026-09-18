import { ProductSortBy } from "@/features/products/types/product.types";
import { updateQueryUrl } from "@/lib/utils/query-params";

export const PRODUCT_FILTER_KEYS = [
  "search",
  "categoryId",
  "inStock",
  "sortBy",
] as const;

export function parseProductSort(
  value: string | null | undefined,
): ProductSortBy {
  return (
    Object.values(ProductSortBy).find((sort) => sort === value) ??
    ProductSortBy.CREATED_AT
  );
}

/** Sorting alone does not mean a genuinely empty catalog has no matching products. */
export function hasProductSearchFilters(query: string): boolean {
  const params = new URLSearchParams(query);
  return Boolean(
    params.get("search")?.trim() ||
      params.get("categoryId") ||
      params.get("inStock") === "true",
  );
}

export function clearProductFilters(pathname: string, query: string): string {
  return updateQueryUrl(pathname, query, {
    search: null,
    categoryId: null,
    inStock: null,
    sortBy: null,
  });
}
