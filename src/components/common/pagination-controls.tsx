"use client";

import { useTransition, type ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/lib/api/types";
import {
  buildPaginationUrl,
  isFirstPage,
  isLastPage,
  isValidPage,
  normalizePagination,
} from "@/lib/utils/pagination";

interface PaginationControlsProps {
  pagination: PaginationMeta;
  baseUrl: string;
}

export function PaginationControls({
  pagination,
  baseUrl,
}: PaginationControlsProps): ReactElement | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("store.categories");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [isPending, startTransition] = useTransition();
  const normalized = normalizePagination(pagination);
  const { page: currentPage, totalPages } = normalized;

  const handlePageChange = (page: number): void => {
    if (!isValidPage(page, totalPages) || isPending) return;
    const preserved: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== "page") preserved[key] = value;
    });
    startTransition(() =>
      router.push(buildPaginationUrl(baseUrl, page, preserved)),
    );
  };
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={tCommon("pagination")}
      className="flex items-center justify-center gap-2 pt-4"
    >
      <Button
        type="button"
        variant="outline"
        disabled={isFirstPage(normalized) || isPending}
        onClick={() => handlePageChange(currentPage - 1)}
        className="h-11 min-w-11 gap-2 px-3"
        aria-label={t("previous")}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
        <span className="hidden sm:inline">{t("previous")}</span>
      </Button>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="min-w-20 text-center text-sm tabular-nums"
      >
        {isPending ? (
          tCommon("loading")
        ) : (
          <>
            <span aria-current="page" className="font-medium">
              {format.number(currentPage)}
            </span>
            <span className="mx-1.5 text-muted-foreground">{t("of")}</span>
            <span className="font-medium">{format.number(totalPages)}</span>
          </>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={isLastPage(normalized) || isPending}
        onClick={() => handlePageChange(currentPage + 1)}
        className="h-11 min-w-11 gap-2 px-3"
        aria-label={t("next")}
      >
        <span className="hidden sm:inline">{t("next")}</span>
        <ChevronRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
      </Button>
    </nav>
  );
}
