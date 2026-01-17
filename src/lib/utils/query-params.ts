/**
 * Query parameter utilities
 * Safe parsing and validation of URL query parameters
 */

/**
 * Safely parse page number from query string
 * Returns 1 if invalid, null, or non-numeric
 * 
 * @param pageParam - Page parameter from URL (can be string, number, or undefined)
 * @param defaultPage - Default page if invalid (default: 1)
 * @returns Valid page number (minimum 1)
 */
export function parsePage(
  pageParam: string | number | undefined | null,
  defaultPage = 1
): number {
  if (!pageParam) {
    return defaultPage;
  }

  const parsed = typeof pageParam === 'string' 
    ? parseInt(pageParam, 10) 
    : pageParam;

  // Check if valid number and >= 1
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 1) {
    return defaultPage;
  }

  return Math.floor(parsed); // Ensure integer
}

/**
 * Safely parse limit/per-page from query string
 * 
 * @param limitParam - Limit parameter from URL
 * @param defaultLimit - Default limit (default: 10)
 * @param maxLimit - Maximum allowed limit (default: 100)
 * @returns Valid limit number
 */
export function parseLimit(
  limitParam: string | number | undefined | null,
  defaultLimit = 10,
  maxLimit = 100
): number {
  if (!limitParam) {
    return defaultLimit;
  }

  const parsed = typeof limitParam === 'string'
    ? parseInt(limitParam, 10)
    : limitParam;

  if (isNaN(parsed) || !isFinite(parsed) || parsed < 1) {
    return defaultLimit;
  }

  // Clamp to max limit
  return Math.min(Math.floor(parsed), maxLimit);
}

/**
 * Clean and validate pagination query params
 * Removes invalid params and returns clean object
 * 
 * @param searchParams - URL search params object
 * @returns Clean pagination params
 */
export function cleanPaginationParams(searchParams: Record<string, string | undefined>) {
  const page = parsePage(searchParams.page);
  const limit = parseLimit(searchParams.limit);

  return {
    page: page === 1 ? undefined : page, // Omit page=1 from URL
    limit: limit === 10 ? undefined : limit, // Omit default limit
  };
}
