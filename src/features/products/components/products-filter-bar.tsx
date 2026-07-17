"use client";

import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ProductSortBy } from "@/features/products/types/product.types";
import { Check, Package, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface ProductsFilterCategoryOption {
  id: string;
  name: string;
}

interface ProductsFilterBarProps {
  currentSort: ProductSortBy;
  inStockOnly: boolean;
  totalItems?: number;
  /** Category options for the category filter (empty hides the filter) */
  categories: ProductsFilterCategoryOption[];
  /** Currently selected category id ("" = all) */
  currentCategoryId: string;
}

/**
 * Mobile-first filter bar inspired by Shopify
 * - Full-width search bar on mobile
 * - Expandable filters drawer on mobile
 * - Clean, minimal design
 * - Native select for sort (best mobile UX)
 * - Toggle chip for in-stock filter
 */
export function ProductsFilterBar({
  currentSort,
  inStockOnly,
  totalItems,
  categories,
  currentCategoryId,
}: ProductsFilterBarProps) {
  const t = useTranslations("store.products");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current search value from URL
  const urlSearch = searchParams.get("search") || "";

  const [showFilters, setShowFilters] = useState(false);

  const sortOptions = [
    { value: ProductSortBy.CREATED_AT, label: t("sortBy.newest") },
    { value: ProductSortBy.NAME, label: t("sortBy.name") },
    {
      value: ProductSortBy.PRICE_LOW_TO_HIGH,
      label: t("sortBy.priceLowToHigh"),
    },
    {
      value: ProductSortBy.PRICE_HIGH_TO_LOW,
      label: t("sortBy.priceHighToLow"),
    },
  ];

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Reset to page 1 when filters change
      params.delete("page");

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      return params.toString();
    },
    [searchParams],
  );

  const handleClearSearch = () => {
    const queryString = createQueryString({ search: null });
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

  const handleSortChange = (sortBy: string) => {
    const queryString = createQueryString({
      sortBy: sortBy === ProductSortBy.CREATED_AT ? null : sortBy,
    });
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

  const handleInStockToggle = () => {
    const queryString = createQueryString({
      inStock: inStockOnly ? null : "true",
    });
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

  const handleCategoryChange = (categoryId: string) => {
    const queryString = createQueryString({
      categoryId: categoryId || null,
    });
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

  const categoryOptions = [
    { value: "", label: t("filters.allCategories") },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const selectedCategoryName = categories.find(
    (category) => category.id === currentCategoryId,
  )?.name;

  // Count active filters
  const activeFiltersCount =
    (inStockOnly ? 1 : 0) +
    (currentCategoryId ? 1 : 0) +
    (currentSort !== ProductSortBy.CREATED_AT ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Search Bar - single shared implementation */}
      <SearchInput
        rounded
        trackAnalytics
        placeholder={t("searchPlaceholder")}
      />

      {/* Filter Controls Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Results count + Filter toggle (mobile) */}
        <div className="flex items-center gap-2">
          {totalItems !== undefined && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("resultsCount", { count: totalItems })}
            </span>
          )}

          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden gap-1.5 h-9 px-3 rounded-full"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>{t("filters.activeFilters")}</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Desktop Filters - Always Visible */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Category Filter */}
          {categories.length > 0 && (
            <Select
              value={currentCategoryId}
              onChange={handleCategoryChange}
              options={categoryOptions}
              className="w-[180px]"
            />
          )}

          {/* In Stock Toggle - Chip style */}
          <Button
            variant={inStockOnly ? "default" : "outline"}
            size="sm"
            onClick={handleInStockToggle}
            className={`
              gap-1.5 h-9 px-3 rounded-full transition-all
              ${
                inStockOnly
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              }
            `}
          >
            <Package className="h-3.5 w-3.5" />
            <span className="text-sm">{t("filters.inStockOnly")}</span>
            {inStockOnly && <Check className="h-3.5 w-3.5 ms-0.5" />}
          </Button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-sm text-muted-foreground whitespace-nowrap"
            >
              {t("sortBy.label")}:
            </label>
            <Select
              value={currentSort}
              onChange={handleSortChange}
              options={sortOptions}
              className="w-[180px]"
            />
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showFilters && (
        <div className="sm:hidden p-4 bg-muted/30 rounded-xl border space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Category */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("filters.category")}
              </label>
              <Select
                value={currentCategoryId}
                onChange={handleCategoryChange}
                options={categoryOptions}
                className="w-full"
              />
            </div>
          )}

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("sortBy.label")}</label>
            <Select
              value={currentSort}
              onChange={handleSortChange}
              options={sortOptions}
              className="w-full"
            />
          </div>

          {/* In Stock Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t("filters.inStockOnly")}
            </span>
            <Button
              variant={inStockOnly ? "default" : "outline"}
              size="sm"
              onClick={handleInStockToggle}
              className="h-8 px-3 rounded-full"
            >
              {inStockOnly ? (
                <>
                  <Check className="h-3.5 w-3.5 me-1" />
                  {t("filters.inStockOnly")}
                </>
              ) : (
                t("filters.inStockOnly")
              )}
            </Button>
          </div>

          {/* Close button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(false)}
            className="w-full rounded-full"
          >
            {tCommon("done")}
          </Button>
        </div>
      )}

      {/* Active Filters Pills (when filters are closed on mobile) */}
      {!showFilters && (inStockOnly || urlSearch || currentCategoryId) && (
        <div className="flex flex-wrap items-center gap-2 sm:hidden">
          {selectedCategoryName && (
            <button
              onClick={() => handleCategoryChange("")}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
            >
              {selectedCategoryName}
              <X className="h-3 w-3 ms-0.5" />
            </button>
          )}
          {urlSearch && (
            <button
              onClick={handleClearSearch}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-muted rounded-full hover:bg-muted/80 transition-colors"
            >
              <Search className="h-3 w-3" />
              &ldquo;{urlSearch}&rdquo;
              <X className="h-3 w-3 ms-0.5" />
            </button>
          )}
          {inStockOnly && (
            <button
              onClick={handleInStockToggle}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
            >
              <Package className="h-3 w-3" />
              {t("filters.inStockOnly")}
              <X className="h-3 w-3 ms-0.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
