import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { ApiException } from '@/lib/api/types';
import { cache } from 'react';
import { PublicStaticPageDto, StaticPageListItem } from '../types/store.types';

/**
 * Fetch all active static pages for a store (Server Action)
 * Uses X-Store-Id header and Accept-Language for localization
 * 
 * Uses React cache() to deduplicate requests within the same request lifecycle.
 */
export const getStaticPages = cache(async (
  storeId: string,
  locale: string = 'en'
): Promise<StaticPageListItem[]> => {
  'use server';

  try {
    const pages = await apiClient.get<StaticPageListItem[]>(
      endpoints.stores.staticPages.list,
      {
        headers: {
          'X-Store-Id': storeId,
          'Accept-Language': locale,
        },
      }
    );
    return pages;
  } catch (error) {
    if (error instanceof ApiException) {
      // If not found or store has no static pages, return empty array
      if (error.statusCode === 404) {
        return [];
      }
      throw error;
    }
    // Return empty array on error to avoid breaking the page
    console.error('Failed to fetch static pages:', error);
    return [];
  }
});

/**
 * Fetch a single static page by slug (Server Action)
 * Uses X-Store-Id header and Accept-Language for localization
 * 
 * Uses React cache() to deduplicate requests within the same request lifecycle.
 */
export const getStaticPageBySlug = cache(async (
  storeId: string,
  slug: string,
  locale: string = 'en'
): Promise<PublicStaticPageDto | null> => {
  'use server';

  try {
    const page = await apiClient.get<PublicStaticPageDto>(
      endpoints.stores.staticPages.getBySlug(slug),
      {
        headers: {
          'X-Store-Id': storeId,
          'Accept-Language': locale,
        },
      }
    );
    return page;
  } catch (error) {
    if (error instanceof ApiException) {
      // If not found, return null
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
    // Return null on error
    console.error('Failed to fetch static page:', error);
    return null;
  }
});

/**
 * Get static page with error handling for UI
 * Returns null and error object instead of throwing
 */
export const getStaticPageWithErrorHandling = cache(async (
  storeId: string,
  slug: string,
  locale: string = 'en'
): Promise<{ page: PublicStaticPageDto | null; error: string | null }> => {
  'use server';

  try {
    const page = await getStaticPageBySlug(storeId, slug, locale);
    if (!page) {
      return { page: null, error: 'Page not found' };
    }
    return { page, error: null };
  } catch (error) {
    if (error instanceof ApiException) {
      return { page: null, error: error.message };
    }
    return { page: null, error: 'An unexpected error occurred' };
  }
});
