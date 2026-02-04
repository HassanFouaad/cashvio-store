import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { ApiException } from '@/lib/api/types';
import { cache } from 'react';
import { PublicStoreDto, StoreError, StoreErrorType } from '../types/store.types';

/**
 * Fetch store details by code (Server Action)
 * This runs on the server and can be called from Server Components
 * 
 * Uses React cache() to deduplicate requests within the same request lifecycle.
 * Multiple calls to getStoreByCode with the same code will only make ONE API request.
 */
export const getStoreBySubdomain = cache(async (subdomain: string): Promise<PublicStoreDto> => {
  'use server';

  try {
    const store = await apiClient.get<PublicStoreDto>(
      endpoints.stores.getBySubdomain(subdomain)
    );
    return store;
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
 * Also cached - uses the same cache as getStoreByCode
 */
export const getStoreWithErrorHandling = cache(async (
  subdomain: string
): Promise<{ store: PublicStoreDto | null; error: StoreError | null }> => {
  'use server';

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
