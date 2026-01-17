'use server';

import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import {
  ListCategoriesQuery,
  PaginatedCategoriesResponse,
  PublicCategoryDto,
} from '@/features/categories/types/category.types';

/**
 * Fetch categories for a store with pagination
 * Server Action for SSR
 */
export async function getCategories(
  query: ListCategoriesQuery,
): Promise<PaginatedCategoriesResponse> {
  // Build query string
  const searchParams = new URLSearchParams({
    tenantId: query.tenantId,
    page: query.page?.toString() || '1',
    limit: query.limit?.toString() || '10',
    ...(query.name && { name: query.name }),
  });

  const response = await apiClient.getPaginated<PublicCategoryDto>(
    `${endpoints.categories.list}?${searchParams.toString()}`,
  );

  return response;
}

/**
 * Fetch categories with error handling
 */
export async function getCategoriesWithErrorHandling(
  query: ListCategoriesQuery,
): Promise<{
  categories: PaginatedCategoriesResponse | null;
  error: Error | null;
}> {
  try {
    const categories = await getCategories(query);
    return { categories, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      categories: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}
