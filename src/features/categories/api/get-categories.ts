import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { ApiException } from '@/lib/api/types';
import { cache } from 'react';
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
  // Build query string. Store context is carried by the X-Store-Id header
  // (set from the resolved store) — never as a query param.
  const searchParams = new URLSearchParams({
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

/**
 * Fetch a single category by ID
 * Uses React cache() to deduplicate requests
 */
export const getCategoryById = cache(
  async (categoryId: string): Promise<PublicCategoryDto> => {
    try {
      // Store context comes from the X-Store-Id header, not a query param.
      const category = await apiClient.get<PublicCategoryDto>(
        endpoints.categories.getById(categoryId)
      );

      return category;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(500, 'Failed to fetch category');
    }
  }
);

/**
 * Fetch a single category with error handling
 */
export const getCategoryByIdWithErrorHandling = cache(
  async (
    categoryId: string
  ): Promise<{
    category: PublicCategoryDto | null;
    error: string | null;
  }> => {
    try {
      const category = await getCategoryById(categoryId);
      return { category, error: null };
    } catch (error) {
      if (error instanceof ApiException) {
        return { category: null, error: error.message };
      }
      return { category: null, error: 'An unexpected error occurred' };
    }
  }
);
