import { PaginatedResponse, PaginationQuery } from '@/lib/api/types';

/**
 * Public Category DTO
 * Matches the backend PublicCategoryDto
 */
export interface PublicCategoryDto {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

/**
 * Paginated response for categories
 */
export type PaginatedCategoriesResponse = PaginatedResponse<PublicCategoryDto>;

/**
 * Query parameters for listing categories
 */
export interface ListCategoriesQuery extends PaginationQuery {
  tenantId: string;
  name?: string;
}
