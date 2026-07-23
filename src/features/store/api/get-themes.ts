import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { StoreFrontThemeDto } from '../types/store.types';

/**
 * How long (seconds) the theme catalog is served from the data cache.
 * The catalog only changes with backend deploys (themes are seeded via
 * migrations), so a longer window than the store config is safe.
 */
const THEMES_CACHE_REVALIDATE_SECONDS = 300;

const fetchThemesCached = unstable_cache(
  async (): Promise<StoreFrontThemeDto[]> => {
    return apiClient.get<StoreFrontThemeDto[]>(endpoints.storeFrontThemes.list);
  },
  ['store-front-themes'],
  { revalidate: THEMES_CACHE_REVALIDATE_SECONDS },
);

/**
 * Fetch the global theme catalog (only called in preview mode — normal
 * renders get the assigned theme nested in the store payload).
 *
 * Returns an empty list on failure: a broken preview lookup must never
 * break the storefront render.
 */
export const getStoreFrontThemes = cache(
  async (): Promise<StoreFrontThemeDto[]> => {
    try {
      return await fetchThemesCached();
    } catch {
      return [];
    }
  },
);
