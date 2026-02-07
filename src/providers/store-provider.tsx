"use client";

import { PublicStoreDto } from "@/features/store/types/store.types";
import { setApiStoreId } from "@/lib/api/types";
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef } from "react";

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
 * Store Provider
 *
 * Ensures the store ID is available for ALL API calls:
 * 1. Sets window.__STORE_ID__ via useEffect (avoids hydration mismatch)
 * 2. Sets cookie for persistence across page loads
 * 3. Sets module variable synchronously for server-side use
 *
 * The inline script in layout.tsx handles the INITIAL window.__STORE_ID__
 * before React hydrates. This provider keeps it in sync on navigation.
 */
export function StoreProvider({
  store,
  subdomain,
  children,
}: StoreProviderProps) {
  const storeId = store?.id ?? null;
  const hasSetRef = useRef(false);

  // Set module variable synchronously (safe - no DOM access)
  useMemo(() => {
    setApiStoreId(storeId);
  }, [storeId]);

  // Set window and cookie in useEffect to avoid hydration mismatches
  useEffect(() => {
    if (!storeId) return;

    // Set window variable - PRIMARY source for client-side API calls
    window.__STORE_ID__ = storeId;

    // Only set cookie once per mount or when storeId changes
    if (!hasSetRef.current) {
      hasSetRef.current = true;
      const maxAge = 365 * 24 * 60 * 60;
      document.cookie = `${STORE_ID_COOKIE_NAME}=${encodeURIComponent(storeId)}; path=/; max-age=${maxAge}; samesite=lax`;
    }
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
