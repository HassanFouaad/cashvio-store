"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactElement,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ProductSortBy } from "@/features/products/types/product.types";
import { clearProductFilters } from "@/features/products/utils/catalog-filters";
import { cn } from "@/lib/utils/cn";
import { updateQueryUrl } from "@/lib/utils/query-params";

interface ProductsFilterCategoryOption {
  id: string;
  name: string;
}
interface ProductsFilterBarProps {
  currentSort: ProductSortBy;
  inStockOnly: boolean;
  totalItems?: number;
  categories: ProductsFilterCategoryOption[];
  currentCategoryId: string;
}

/** One responsive set of labeled filters, rather than duplicate mobile controls. */
export function ProductsFilterBar({
  currentSort,
  inStockOnly,
  totalItems,
  categories,
  currentCategoryId,
}: ProductsFilterBarProps): ReactElement {
  const t = useTranslations("store.products");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const id = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = `${id}-filters`;
  const query = searchParams.toString();
  const urlSearch = searchParams.get("search")?.trim() || "";

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
  const categoryOptions = [
    { value: "", label: t("filters.allCategories") },
    ...categories.map(({ id, name }) => ({ value: id, label: name })),
  ];
  const categoryName =
    categories.find((category) => category.id === currentCategoryId)?.name ??
    t("filters.category");
  const sortLabel =
    sortOptions.find((option) => option.value === currentSort)?.label ??
    t("sortBy.newest");
  const activeFilters = [
    ...(urlSearch ? [{ key: "search", label: urlSearch }] : []),
    ...(currentCategoryId ? [{ key: "categoryId", label: categoryName }] : []),
    ...(inStockOnly
      ? [{ key: "inStock", label: t("filters.inStockOnly") }]
      : []),
    ...(currentSort !== ProductSortBy.CREATED_AT
      ? [{ key: "sortBy", label: `${t("sortBy.label")}: ${sortLabel}` }]
      : []),
  ];

  const navigate = useCallback(
    (url: string): void => {
      const currentUrl = query ? `${pathname}?${query}` : pathname;
      if (currentUrl !== url)
        startTransition(() => router.push(url, { scroll: false }));
    },
    [pathname, query, router],
  );
  const updateFilter = (key: string, value: string | null): void =>
    navigate(updateQueryUrl(pathname, query, { [key]: value }));
  const closeFilters = (): void => {
    setShowFilters(false);
    toggleRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      <SearchInput
        rounded
        trackAnalytics
        placeholder={t("searchPlaceholder")}
        disabled={isPending}
        onNavigate={navigate}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
        >
          {isPending && (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          )}
          {isPending
            ? t("filters.updating")
            : totalItems !== undefined
              ? t("resultsCount", { count: totalItems })
              : null}
        </span>
        <Button
          ref={toggleRef}
          type="button"
          variant="outline"
          onClick={() => setShowFilters((current) => !current)}
          aria-expanded={showFilters}
          aria-controls={panelId}
          className="h-11 gap-2 rounded-full sm:hidden"
        >
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
          {t("filters.activeFilters")}
          {activeFilters.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </div>

      <div
        id={panelId}
        className={cn(
          "rounded-xl border border-border bg-card p-3 sm:block sm:p-4",
          !showFilters && "hidden",
        )}
      >
        <fieldset
          disabled={isPending}
          className={cn(
            "grid min-w-0 gap-3 sm:grid-cols-2",
            categories.length > 0 && "lg:grid-cols-3",
          )}
        >
          <legend className="sr-only">{t("filters.activeFilters")}</legend>
          {categories.length > 0 && (
            <div className="min-w-0 space-y-1.5">
              <label
                htmlFor={`${id}-category`}
                className="block text-sm font-medium"
              >
                {t("filters.category")}
              </label>
              <Select
                id={`${id}-category`}
                name="categoryId"
                value={currentCategoryId}
                onChange={(value) => updateFilter("categoryId", value || null)}
                options={categoryOptions}
                className="w-full"
              />
            </div>
          )}
          <div className="min-w-0 space-y-1.5">
            <label htmlFor={`${id}-sort`} className="block text-sm font-medium">
              {t("sortBy.label")}
            </label>
            <Select
              id={`${id}-sort`}
              name="sortBy"
              value={currentSort}
              onChange={(value) =>
                updateFilter(
                  "sortBy",
                  value === ProductSortBy.CREATED_AT ? null : value,
                )
              }
              options={sortOptions}
              className="w-full"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            aria-pressed={inStockOnly}
            onClick={() => updateFilter("inStock", inStockOnly ? null : "true")}
            className={cn(
              "h-11 gap-2 self-end",
              inStockOnly &&
                "border-foreground bg-accent text-accent-foreground",
            )}
          >
            {inStockOnly && <Check aria-hidden="true" className="h-4 w-4" />}
            {t("filters.inStockOnly")}
          </Button>
        </fieldset>
        <Button
          type="button"
          variant="ghost"
          onClick={closeFilters}
          className="mt-3 h-11 w-full sm:hidden"
        >
          {tCommon("done")}
        </Button>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Button
              key={filter.key}
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => updateFilter(filter.key, null)}
              aria-label={t("filters.remove", { filter: filter.label })}
              className="h-11 max-w-full gap-2 rounded-full bg-muted/40 px-3 text-xs"
            >
              <span className="min-w-0 truncate">{filter.label}</span>
              <X aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => navigate(clearProductFilters(pathname, query))}
            className="h-11 text-sm underline underline-offset-4"
          >
            {t("filters.clearAll")}
          </Button>
        </div>
      )}
    </div>
  );
}
