import { getStoreBySubdomain } from '@/features/store/api/get-store';
import { PublicStoreDto } from '@/features/store/types/store.types';
import { getStoreSubdomain } from '@/features/store/utils/store-resolver';
import { setApiLocale, setApiStoreId } from '@/lib/api/types';
import { isValidLocale, Locale } from '@/types/enums';
import { getLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { cache } from 'react';

/**
 * Resolve the store from the current request context and set API store ID + locale.
 *
 * This function:
 * 1. Reads the hostname from Next.js request headers
 * 2. Extracts the store subdomain
 * 3. Fetches the store details (cached — no duplicate API calls)
 * 4. Sets the store ID in the request-scoped API context
 * 5. Sets the locale in the request-scoped API context for Accept-Language header
 *
 * It is cached per request via React.cache(), so calling it multiple
 * times in the same request (e.g. in generateMetadata AND the component)
 * is free — only one resolution + API call happens.
 *
 * CRITICAL: Call this at the start of every server-side page/metadata
 * function that needs to make API calls requiring X-Store-Id.
 * This ensures the store ID AND locale are always available in the correct
 * React.cache() scope, even during client-side navigation where the
 * layout doesn't re-execute (so layout's setApiLocale doesn't run).
 */
export const resolveRequestStore = cache(async (): Promise<{
  store: PublicStoreDto | null;
  subdomain: string | null;
}> => {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const subdomain = getStoreSubdomain(hostname);

  // Always set the locale for this request context.
  // During client-side navigation, the layout doesn't re-execute,
  // so the layout's setApiLocale() never runs — the locale would
  // default to ENGLISH. Setting it here guarantees every page's
  // API calls use the correct Accept-Language header.
  const localeString = await getLocale();
  const locale = isValidLocale(localeString) ? localeString : Locale.ENGLISH;
  setApiLocale(locale);

  if (!subdomain) {
    return { store: null, subdomain: null };
  }

  try {
    const store = await getStoreBySubdomain(subdomain);
    // Set store ID in the request-scoped API context
    // so all subsequent apiClient calls include X-Store-Id header
    setApiStoreId(store.id);
    return { store, subdomain };
  } catch {
    return { store: null, subdomain };
  }
});
