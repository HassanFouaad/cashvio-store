/**
 * Pagination redirect utilities
 * Handles validation and redirection for paginated pages
 */

import { redirect } from 'next/navigation';
import { PaginationMeta } from '@/lib/api/types';
import { getSafePage } from './pagination';

/**
 * Validate pagination and redirect if out of range
 * Call this after fetching paginated data to ensure user is on a valid page
 * 
 * @param pagination - Pagination metadata from API response
 * @param requestedPage - Page number user requested
 * @param baseUrl - Base URL to redirect to (e.g., '/store/ABC/categories')
 * @param searchParams - Additional search params to preserve (e.g., { search: 'query' })
 * @returns void - Redirects if needed, otherwise does nothing
 * 
 * @example
 * ```typescript
 * const { data, pagination } = await getData(requestedPage);
 * 
 * // Will redirect to safe page if requestedPage is out of range
 * validatePaginationAndRedirect(
 *   pagination,
 *   requestedPage,
 *   `/store/${code}/categories`,
 *   { search }
 * );
 * ```
 */
export function validatePaginationAndRedirect(
  pagination: PaginationMeta | undefined,
  requestedPage: number,
  baseUrl: string,
  searchParams?: Record<string, string | undefined>
): void {
  // If no pagination data, can't validate
  if (!pagination) {
    return;
  }

  const { totalPages } = pagination;

  // If requested page is within range, no redirect needed
  if (requestedPage <= totalPages || totalPages === 0) {
    return;
  }

  // Calculate safe page
  const safePage = getSafePage(requestedPage, totalPages);

  // Build new URL with safe page
  const params = new URLSearchParams();
  
  // Only add page if not page 1
  if (safePage > 1) {
    params.set('page', String(safePage));
  }

  // Preserve other search params
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      }
    });
  }

  // Build final URL
  const queryString = params.toString();
  const newUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  // Redirect to valid page
  redirect(newUrl);
}

/**
 * Build pagination URL with preserved search params
 * Useful for creating navigation links
 * 
 * @param baseUrl - Base URL (e.g., '/store/ABC/categories')
 * @param page - Page number (omitted if 1)
 * @param searchParams - Additional search params
 * @returns Complete URL with query string
 * 
 * @example
 * ```typescript
 * const url = buildPaginationUrl('/store/ABC/products', 2, { search: 'laptop' });
 * // Returns: '/store/ABC/products?page=2&search=laptop'
 * ```
 */
export function buildPaginationUrl(
  baseUrl: string,
  page?: number,
  searchParams?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();

  // Add page if not 1
  if (page && page > 1) {
    params.set('page', String(page));
  }

  // Add other params
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      }
    });
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
