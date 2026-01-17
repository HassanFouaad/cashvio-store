/**
 * Core API types and interfaces
 * Matches the actual backend response structure from ResponseTransformer
 */

/**
 * ============================================
 * API RESPONSE TYPES
 * ============================================
 */

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/**
 * API Response meta structure
 * Non-paginated: { timestamp }
 * Paginated: { timestamp, pagination }
 */
export interface ApiResponseMeta {
  timestamp: string;
  pagination?: PaginationMeta; // Only present for paginated responses
  [key: string]: unknown;
}

/**
 * Standard API response structure
 * Works for both paginated and non-paginated responses
 * 
 * Non-paginated: { success, data: T, meta: { timestamp } }
 * Paginated: { success, data: T[], meta: { timestamp, pagination: {...} } }
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: ApiResponseMeta;
}

/**
 * Application-level paginated response (transformed for easier use)
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * API error response
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    path?: string;
  };
}

/**
 * API Exception class for structured error handling
 */
export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error?: string
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

/**
 * ============================================
 * QUERY TYPES
 * ============================================
 */

/**
 * Query parameters for pagination
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * Extended fetch options with timeout support
 */
export interface FetchOptions extends RequestInit {
  timeout?: number;
}
