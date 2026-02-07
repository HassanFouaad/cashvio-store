"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProductSortBy } from "@/features/products/types/product.types";
import { analytics } from "@/lib/analytics";
import { Check, Package, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";

interface ProductsFilterBarProps {
  currentSort: ProductSortBy;
  inStockOnly: boolean;
  totalItems?: number;
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
}: ProductsFilterBarProps) {
  const t = useTranslations("store.products");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current search value from URL
  const urlSearch = searchParams.get("search") || "";

  // Local state for input value
  const [searchValue, setSearchValue] = useState(urlSearch);
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

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedSearch = searchValue.trim();

    // Track search event
    if (trimmedSearch) {
      try {
        analytics.trackSearch({ search_term: trimmedSearch });
      } catch {
        // Analytics errors must never affect the store
      }
    }

    const queryString = createQueryString({
      search: trimmedSearch || null,
    });
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

  const handleClearSearch = () => {
    setSearchValue("");
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

  // Count active filters
  const activeFiltersCount =
    (inStockOnly ? 1 : 0) + (currentSort !== ProductSortBy.CREATED_AT ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Search Bar - Full Width, Shopify-like */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <Search className="absolute start-4 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full h-12 ps-12 pe-24 text-base rounded-full border-2 border-muted bg-muted/30 focus:border-primary focus:bg-background transition-all placeholder:text-muted-foreground/70"
          />
          {/* Clear and Search buttons */}
          <div className="absolute end-2 flex items-center gap-1">
            {searchValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-8 px-4 rounded-full"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
              <span className="ms-1.5 hidden sm:inline">
                {t("searchPlaceholder").split("...")[0]}
              </span>
            </Button>
          </div>
        </div>
      </form>

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
            {t("filters.activeFilters")}
          </Button>
        </div>
      )}

      {/* Active Filters Pills (when filters are closed on mobile) */}
      {!showFilters && (inStockOnly || urlSearch) && (
        <div className="flex flex-wrap items-center gap-2 sm:hidden">
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
