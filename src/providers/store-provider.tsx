"use client";

import { PublicStoreDto } from "@/features/store/types/store.types";
import { setApiStoreId } from "@/lib/api/types";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";

interface StoreContextValue {
  storeId: string | null;
}

const StoreContext = createContext<StoreContextValue>({ storeId: null });

interface StoreProviderProps {
  children: ReactNode;
  store: PublicStoreDto | null;
  subdomain: string | null;
}

// Cookie name must match the one in types.ts and layout.tsx
const STORE_ID_COOKIE_NAME = "sf_store_id";

/**
 * Store Provider - Client-side store ID management
 *
 * SERVER SIDE:
 *   Store ID is set by layout.tsx via setApiStoreId() using React.cache()
 *   for request-scoped isolation. This provider doesn't need to do anything
 *   on the server - it just provides React context.
 *
 * CLIENT SIDE:
 *   The inline script in layout.tsx <head> sets window.__STORE_ID__ BEFORE
 *   React hydrates. This provider keeps it in sync on client-side navigations
 *   and sets a cookie for persistence.
 */
export function StoreProvider({
  store,
  subdomain,
  children,
}: StoreProviderProps) {
  const storeId = store?.id ?? null;

  // Keep window.__STORE_ID__ and cookie in sync on client-side navigations.
  // The inline script in layout.tsx handles the initial set before hydration.
  // This useEffect handles subsequent SPA navigations.
  useEffect(() => {
    if (!storeId) return;

    // Set window variable - PRIMARY source for client-side API calls
    setApiStoreId(storeId);

    // Set cookie for persistence across full page loads
    const maxAge = 365 * 24 * 60 * 60;
    document.cookie = `${STORE_ID_COOKIE_NAME}=${encodeURIComponent(storeId)}; path=/; max-age=${maxAge}; samesite=lax`;
  }, [storeId]);

  const value = useMemo(() => ({ storeId }), [storeId]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

/**
 * Hook to get the current store ID
 */
export function useStoreId(): string | null {
  return useContext(StoreContext).storeId;
}
