/**
 * Pagination utilities
 * Shared logic for handling pagination across the application
 */

import { PaginationMeta } from '@/lib/api/types';

/**
 * Normalize pagination meta to ensure all values are numbers
 * Prevents string concatenation issues (e.g., "1" + 1 = "11")
 * 
 * @param pagination - Raw pagination data that might have string values
 * @returns Normalized pagination with guaranteed number values
 */
export function normalizePagination(pagination: PaginationMeta): PaginationMeta {
  return {
    page: Number(pagination.page) || 1,
    limit: Number(pagination.limit) || 10,
    totalItems: Number(pagination.totalItems) || 0,
    totalPages: Number(pagination.totalPages) || 1,
  };
}

/**
 * Validate if a page number is within valid range
 * 
 * @param page - Page number to validate
 * @param totalPages - Total number of pages
 * @returns True if page is valid, false otherwise
 */
export function isValidPage(page: number, totalPages: number): boolean {
  const pageNum = Number(page);
  const totalPagesNum = Number(totalPages);
  return pageNum >= 1 && pageNum <= totalPagesNum;
}

/**
 * Get safe page number (clamps to valid range)
 * 
 * @param page - Desired page number
 * @param totalPages - Total number of pages
 * @returns Page number clamped between 1 and totalPages
 */
export function getSafePage(page: number, totalPages: number): number {
  const pageNum = Number(page) || 1;
  const totalPagesNum = Number(totalPages) || 1;
  return Math.max(1, Math.min(pageNum, totalPagesNum));
}

/**
 * Check if we're on the first page
 */
export function isFirstPage(pagination: PaginationMeta): boolean {
  return Number(pagination.page) <= 1;
}

/**
 * Check if we're on the last page
 */
export function isLastPage(pagination: PaginationMeta): boolean {
  return Number(pagination.page) >= Number(pagination.totalPages);
}

/**
 * Calculate offset for database queries
 * 
 * @param page - Current page (1-based)
 * @param limit - Items per page
 * @returns Zero-based offset for database queries
 */
export function getOffset(page: number, limit: number): number {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  return (pageNum - 1) * limitNum;
}

/**
 * Build pagination query parameters
 * 
 * @param page - Page number
 * @param limit - Items per page
 * @param additionalParams - Additional query parameters
 * @returns URLSearchParams object
 */
export function buildPaginationParams(
  page?: number,
  limit?: number,
  additionalParams?: Record<string, string | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
  }
  
  return params;
}

/**
 * Get pagination info text (e.g., "Showing 1-10 of 100 items")
 * 
 * @param pagination - Pagination metadata
 * @returns Object with pagination info
 */
export function getPaginationInfo(pagination: PaginationMeta) {
  const page = Number(pagination.page);
  const limit = Number(pagination.limit);
  const totalItems = Number(pagination.totalItems);
  
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);
  
  return {
    startItem,
    endItem,
    totalItems,
    hasItems: totalItems > 0,
  };
}
