'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import {
  ListCategoriesQuery,
  PaginatedCategoriesResponse,
  PublicCategoryDto,
} from '../types/category.types';

/**
 * React Query hook for fetching categories
 * For client components
 */
export function useCategories(query: ListCategoriesQuery) {
  return useQuery<PaginatedCategoriesResponse>({
    queryKey: ['categories', query],
    queryFn: async () => {
      // Build query string
      const searchParams = new URLSearchParams({
        tenantId: query.tenantId,
        page: query.page?.toString() || '1',
        limit: query.limit?.toString() || '10',
        ...(query.name && { name: query.name }),
      });

      const response = await apiClient.get<PublicCategoryDto[]>(
        `${endpoints.categories.list}?${searchParams.toString()}`,
      );
      return response as any;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
