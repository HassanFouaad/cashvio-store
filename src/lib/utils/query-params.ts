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
 defaultPage = 1,
): number {
 if (!pageParam) {
  return defaultPage;
 }

 const parsed =
  typeof pageParam === "string" ? parseInt(pageParam, 10) : pageParam;

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
 maxLimit = 100,
): number {
 if (!limitParam) {
  return defaultLimit;
 }

 const parsed =
  typeof limitParam === "string" ? parseInt(limitParam, 10) : limitParam;

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
export function cleanPaginationParams(
 searchParams: Record<string, string | undefined>,
) {
 const page = parsePage(searchParams.page);
 const limit = parseLimit(searchParams.limit);

 return {
  page: page === 1 ? undefined : page, // Omit page=1 from URL
  limit: limit === 10 ? undefined : limit, // Omit default limit
 };
}

/** Apply a navigation intent without dropping locale, preview or campaign params. */
export function updateQueryUrl(
 pathname: string,
 currentQuery: string,
 updates: Readonly<Record<string, string | null>>,
 resetPage = true,
): string {
 const params = new URLSearchParams(currentQuery);
 if (resetPage) params.delete("page");
 for (const [key, value] of Object.entries(updates)) {
  if (value === null || value === "") params.delete(key);
  else params.set(key, value);
 }
 const query = params.toString();
 return query ? `${pathname}?${query}` : pathname;
}

/** Next search params may contain repeated keys; match URLSearchParams.get semantics. */
export function normalizeSearchParams(
 params: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
 return Object.fromEntries(
  Object.entries(params).map(([key, value]) => [
   key,
   Array.isArray(value) ? value[0] : value,
  ]),
 );
}
