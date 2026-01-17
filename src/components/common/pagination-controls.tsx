'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PaginationMeta } from '@/lib/api/types';
import { isFirstPage, isLastPage, isValidPage, normalizePagination } from '@/lib/utils/pagination';
import { buildPaginationUrl } from '@/lib/utils/pagination-redirect';

interface PaginationControlsProps {
  pagination: PaginationMeta;
  baseUrl: string;
}

/**
 * Reusable client-side pagination controls
 * Handles page navigation via URL query params
 * Uses shared pagination utilities for consistent behavior
 */
export function PaginationControls({
  pagination,
  baseUrl,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('store.categories');

  // Normalize pagination to ensure all values are numbers
  const normalizedPagination = normalizePagination(pagination);
  const { page: currentPage, totalPages } = normalizedPagination;
  
  // Check pagination state using shared utilities
  const isFirst = isFirstPage(normalizedPagination);
  const isLast = isLastPage(normalizedPagination);

  const handlePageChange = (newPage: number) => {
    // Validate page number using shared utility
    if (!isValidPage(newPage, totalPages)) {
      return;
    }

    // Get current search params (excluding page)
    const currentParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'page') {
        currentParams[key] = value;
      }
    });

    // Build URL - automatically omits page=1
    const url = buildPaginationUrl(baseUrl, newPage, currentParams);
    router.push(url);
  };

  // Hide pagination if only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={isFirst}
        className="gap-1 sm:gap-2"
        aria-label={t('previous')}
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        <span className="hidden sm:inline">{t('previous')}</span>
      </Button>

      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
        <span className="font-medium">{currentPage}</span>
        <span className="text-muted-foreground">{t('of')}</span>
        <span className="font-medium">{totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={isLast}
        className="gap-1 sm:gap-2"
        aria-label={t('next')}
      >
        <span className="hidden sm:inline">{t('next')}</span>
        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
      </Button>
    </div>
  );
}
