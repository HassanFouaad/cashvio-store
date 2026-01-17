'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { CACHE_KEYS, QUERY_STALE_TIME } from '@/lib/constants';
import { PublicStoreDto } from '../types/store.types';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';

/**
 * React Query hook for fetching store details (Client-side)
 * Use this in Client Components when you need reactive updates
 */
export function useStore(
  code: string,
  options?: Omit<UseQueryOptions<PublicStoreDto>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [CACHE_KEYS.STORE, code],
    queryFn: () => apiClient.get<PublicStoreDto>(endpoints.stores.getByCode(code)),
    staleTime: QUERY_STALE_TIME.STORE,
    ...options,
  });
}
