/**
 * Reusable Pagination Types
 * Matches backend PaginatedResponseDto structure
 */

/**
 * Base paginated response interface
 * All paginated API responses should extend this
 * 
 * @example
 * ```typescript
 * interface PaginatedCategoriesResponse extends PaginatedResponse<CategoryDto> {}
 * ```
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Pagination metadata only (extracted from PaginatedResponse)
 * Use this when you only need pagination info without the data
 */
export type PaginationMeta = Omit<PaginatedResponse<never>, 'items'>;

/**
 * Query parameters for pagination
 * Extend this in your feature-specific query types
 * 
 * @example
 * ```typescript
 * interface ListCategoriesQuery extends PaginationQuery {
 *   tenantId: string;
 *   name?: string;
 * }
 * ```
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}
