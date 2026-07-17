import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { ApiException, getApiLocale } from '@/lib/api/types';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { PublicStoreDto, StoreError, StoreErrorType } from '../types/store.types';

/**
 * How long (seconds) a store config is served from the data cache before
 * being refetched. Store config changes rarely (branding, status, hero
 * images), so a short window removes one backend round-trip from every
 * page view while portal changes still appear within a minute.
 *
 * Safety notes:
 * - Presigned image URLs in the payload live for 1 hour — far longer
 *   than this window, so cached URLs never go stale.
 * - Errors (e.g. unknown subdomain) are NOT cached by unstable_cache.
 */
const STORE_CACHE_REVALIDATE_SECONDS = 60;

/**
 * Cross-request cached fetch. The locale is an explicit argument (and an
 * explicit header) because the backend localizes country names — it MUST
 * be part of the cache key, never read implicitly inside the cached scope.
 */
const fetchStoreBySubdomainCached = unstable_cache(
  async (subdomain: string, locale: string): Promise<PublicStoreDto> => {
    return apiClient.get<PublicStoreDto>(
      endpoints.stores.getBySubdomain(subdomain),
      { headers: { 'Accept-Language': locale } },
    );
  },
  ['store-by-subdomain'],
  { revalidate: STORE_CACHE_REVALIDATE_SECONDS },
);

/**
 * Fetch store details by subdomain.
 *
 * Two cache layers:
 * 1. React cache() — dedupes calls within one request
 * 2. unstable_cache — shares the result across requests for 60s
 */
export const getStoreBySubdomain = cache(async (subdomain: string): Promise<PublicStoreDto> => {
  try {
    const locale = getApiLocale();
    return await fetchStoreBySubdomainCached(subdomain, locale);
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, 'Failed to fetch store details');
  }
});

/**
 * Get store with error handling for UI
 * Returns null and error object instead of throwing
 *
 * Also cached - uses the same cache as getStoreBySubdomain
 */
export const getStoreWithErrorHandling = cache(async (
  subdomain: string
): Promise<{ store: PublicStoreDto | null; error: StoreError | null }> => {
  try {
    const store = await getStoreBySubdomain(subdomain);
    return { store, error: null };
  } catch (error) {
    if (error instanceof ApiException) {
      if (error.statusCode === 404) {
        return {
          store: null,
          error: {
            type: StoreErrorType.NOT_FOUND,
            message: 'Store not found',
            subdomain,
          },
        };
      }
      return {
        store: null,
        error: {
          type: StoreErrorType.NETWORK_ERROR,
          message: error.message,
          subdomain,
        },
      };
    }
    return {
      store: null,
      error: {
        type: StoreErrorType.UNKNOWN,
        message: 'An unexpected error occurred',
        subdomain,
      },
    };
  }
});
