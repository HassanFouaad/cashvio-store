import { getStoreBySubdomain } from '@/features/store/api/get-store';
import { PublicStoreDto } from '@/features/store/types/store.types';
import { getStoreSubdomain } from '@/features/store/utils/store-resolver';
import { setApiStoreId } from '@/lib/api/types';
import { cache } from 'react';
import { headers } from 'next/headers';

/**
 * Resolve the store from the current request context and set API store ID.
 *
 * This function:
 * 1. Reads the hostname from Next.js request headers
 * 2. Extracts the store subdomain
 * 3. Fetches the store details (cached — no duplicate API calls)
 * 4. Sets the store ID in the request-scoped API context
 *
 * It is cached per request via React.cache(), so calling it multiple
 * times in the same request (e.g. in generateMetadata AND the component)
 * is free — only one resolution + API call happens.
 *
 * CRITICAL: Call this at the start of every server-side page/metadata
 * function that needs to make API calls requiring X-Store-Id.
 * This ensures the store ID is always available in the correct
 * React.cache() scope, even if the layout's setApiStoreId didn't
 * propagate (e.g. across generateMetadata boundaries).
 */
export const resolveRequestStore = cache(async (): Promise<{
  store: PublicStoreDto | null;
  subdomain: string | null;
}> => {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const subdomain = getStoreSubdomain(hostname);

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
