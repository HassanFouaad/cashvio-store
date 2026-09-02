import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { ApiException, getApiLocale } from '@/lib/api/types';
import { cache } from 'react';
import { PublicStoreDto, StoreError, StoreErrorType } from '../types/store.types';

const fetchStoreBySubdomain = async (
  subdomain: string,
  locale: string,
): Promise<PublicStoreDto> => {
  return apiClient.get<PublicStoreDto>(
    endpoints.stores.getBySubdomain(subdomain),
    { headers: { 'Accept-Language': locale } },
  );
};

/**
 * Fetch store details by subdomain.
 *
 * React cache() dedupes calls within one request only. There is no
 * cross-request cache on initial lookup — every request hits the backend
 * (which owns its own cache invalidation after subdomain renames).
 */
export const getStoreBySubdomain = cache(async (subdomain: string): Promise<PublicStoreDto> => {
  try {
    const locale = getApiLocale();
    return await fetchStoreBySubdomain(subdomain, locale);
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
