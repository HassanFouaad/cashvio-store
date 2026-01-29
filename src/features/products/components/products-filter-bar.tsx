"use client";

import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ProductSortBy } from "@/features/products/types/product.types";
import { Check, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface ProductsFilterBarProps {
  currentSort: ProductSortBy;
  inStockOnly: boolean;
  totalItems?: number;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

/**
 * Mobile-first filter bar inspired by Shopify
 * - Clean, minimal design
 * - Native select for sort (best mobile UX)
 * - Toggle chip for in-stock filter
 * - Optional search input
 */
export function ProductsFilterBar({
  currentSort,
  inStockOnly,
  totalItems,
  showSearch = false,
  searchPlaceholder,
}: ProductsFilterBarProps) {
  const t = useTranslations("store.products");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortOptions = [
    { value: ProductSortBy.CREATED_AT, label: t("sortBy.newest") },
    { value: ProductSortBy.NAME, label: t("sortBy.name") },
    { value: ProductSortBy.PRICE_LOW_TO_HIGH, label: t("sortBy.priceLowToHigh") },
    { value: ProductSortBy.PRICE_HIGH_TO_LOW, label: t("sortBy.priceHighToLow") },
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
    [searchParams]
  );

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

  return (
    <div className="space-y-3">
      {/* Main Filter Row - Mobile First */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search Input (when enabled) */}
        {showSearch && (
          <div className="w-full sm:w-auto sm:flex-1 sm:max-w-xs">
            <SearchInput
              placeholder={searchPlaceholder || t("searchPlaceholder")}
              searchKey="search"
            />
          </div>
        )}

        {/* Filters Row */}
        <div className="flex items-center justify-between gap-3 flex-1">
          {/* Left: Results count (optional) + In Stock Filter */}
          <div className="flex items-center gap-2 min-w-0">
            {totalItems !== undefined && (
              <span className="text-sm text-muted-foreground whitespace-nowrap hidden md:inline">
                {t("resultsCount", { count: totalItems })}
              </span>
            )}

            {/* In Stock Toggle - Chip style */}
            <Button
              variant={inStockOnly ? "default" : "outline"}
              size="sm"
              onClick={handleInStockToggle}
              className={`
                gap-1.5 h-9 px-3 rounded-full transition-all
                ${inStockOnly 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-muted"
                }
              `}
            >
              <Package className="h-3.5 w-3.5" />
              <span className="text-sm">{t("filters.inStockOnly")}</span>
              {inStockOnly && <Check className="h-3.5 w-3.5 ml-0.5" />}
            </Button>
          </div>

          {/* Right: Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label
              htmlFor="sort-select"
              className="text-sm text-muted-foreground hidden sm:inline whitespace-nowrap"
            >
              {t("sortBy.label")}:
            </label>
            <Select
              value={currentSort}
              onChange={handleSortChange}
              options={sortOptions}
              className="w-[140px] sm:w-[180px]"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Summary (Mobile) */}
      {inStockOnly && (
        <div className="flex items-center gap-2 sm:hidden">
          <span className="text-xs text-muted-foreground">{t("filters.activeFilters")}:</span>
          <button
            onClick={handleInStockToggle}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
          >
            {t("filters.inStockOnly")}
            <span className="text-primary/70">&times;</span>
          </button>
        </div>
      )}
    </div>
  );
}
