"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, type ReactElement } from "react";
import { PackageSearch, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { ProductResultsStatus } from "@/features/products/types/product-results.types";
import {
  clearProductFilters,
  hasProductSearchFilters,
} from "@/features/products/utils/catalog-filters";
import { updateQueryUrl } from "@/lib/utils/query-params";

interface ProductsFeedbackProps {
  status: ProductResultsStatus;
  baseUrl: string;
}

export function ProductsFeedback({
  status,
  baseUrl,
}: ProductsFeedbackProps): ReactElement {
  const t = useTranslations("store.products");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors.products");
  const router = useRouter();
  const query = useSearchParams().toString();
  const [isPending, startTransition] = useTransition();
  const hasFilters = hasProductSearchFilters(query);
  const isError = status === ProductResultsStatus.ERROR;
  const isEmptyPage = status === ProductResultsStatus.EMPTY_PAGE;
  let title = t("noProducts");
  let description = t("emptyDescription");
  if (isError) {
    title = tCommon("error");
    description = tErrors("loadFailed");
  } else if (isEmptyPage) {
    title = t("noResultsOnPage");
  } else if (hasFilters) {
    title = t("noMatchesTitle");
    description = t("noMatchesDescription");
  }

  return (
    <div
      role="status"
      className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center sm:py-16"
    >
      <PackageSearch
        aria-hidden="true"
        className="mx-auto h-10 w-10 text-muted-foreground"
        strokeWidth={1.5}
      />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {!isEmptyPage && (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isError && (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => router.refresh())}
            className="min-h-11 gap-2"
          >
            <RefreshCw
              aria-hidden="true"
              className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            {tCommon("tryAgain")}
          </Button>
        )}
        {isEmptyPage && (
          <Link
            href={updateQueryUrl(baseUrl, query, { page: null })}
            className={buttonVariants({ size: "lg" })}
          >
            {t("backToFirstPage")}
          </Link>
        )}
        {hasFilters && (
          <Button
            type="button"
            variant={isError || isEmptyPage ? "outline" : "default"}
            disabled={isPending}
            onClick={() =>
              startTransition(() =>
                router.push(clearProductFilters(baseUrl, query), {
                  scroll: false,
                }),
              )
            }
            className="min-h-11"
          >
            {t("filters.clearAll")}
          </Button>
        )}
        {!hasFilters && !isEmptyPage && (
          <Link
            href={clearProductFilters("/", query)}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {tCommon("goHome")}
          </Link>
        )}
      </div>
    </div>
  );
}
