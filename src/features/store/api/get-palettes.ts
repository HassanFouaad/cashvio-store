import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { StoreFrontPaletteDto } from '../types/store.types';

/**
 * How long (seconds) the palette catalog is served from the data cache.
 * The catalog only changes with backend deploys (palettes are seeded via
 * migrations), so a longer window than the store config is safe.
 */
const PALETTES_CACHE_REVALIDATE_SECONDS = 300;

const fetchPalettesCached = unstable_cache(
  async (): Promise<StoreFrontPaletteDto[]> => {
    return apiClient.get<StoreFrontPaletteDto[]>(
      endpoints.storeFrontPalettes.list,
    );
  },
  ['store-front-palettes'],
  { revalidate: PALETTES_CACHE_REVALIDATE_SECONDS },
);

/**
 * Fetch the global palette catalog (only called in preview mode — normal
 * renders get the assigned palette nested in the store payload).
 *
 * Returns an empty list on failure: a broken preview lookup must never
 * break the storefront render.
 */
export const getStoreFrontPalettes = cache(
  async (): Promise<StoreFrontPaletteDto[]> => {
    try {
      return await fetchPalettesCached();
    } catch {
      return [];
    }
  },
);
