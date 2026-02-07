"use client";

import { PublicStoreDto } from "@/features/store/types/store.types";
import { setApiStoreId } from "@/lib/api/types";
import { createContext, ReactNode, useContext, useMemo } from "react";

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
 * 1. Sets window.__STORE_ID__ (primary source for client-side API calls)
 * 2. Sets cookie for persistence across page loads
 * 3. Sets module variable as backup
 *
 * This runs SYNCHRONOUSLY during render (via useMemo with empty deps trick)
 * to ensure the store ID is set BEFORE any child component makes API calls.
 */
export function StoreProvider({
  store,
  subdomain,
  children,
}: StoreProviderProps) {
  const storeId = store?.id ?? null;
  // CRITICAL: Set store ID synchronously during EVERY render
  // Not just on mount - this ensures it's always available after navigation
  if (storeId && typeof window !== "undefined") {
    // Set window variable - PRIMARY source for client-side API calls
    window.__STORE_ID__ = storeId;

    // Set cookie for persistence
    const maxAge = 365 * 24 * 60 * 60;
    document.cookie = `${STORE_ID_COOKIE_NAME}=${encodeURIComponent(storeId)}; path=/; max-age=${maxAge}; samesite=lax`;
  }

  // Also set module variable (for server-side and as backup)
  useMemo(() => {
    setApiStoreId(storeId);
  }, [storeId]);

  const value = useMemo(() => ({ storeId }), [storeId]);

  /* 
  if(!storeId){
    return <StoreErrorComponent error={{ type: StoreErrorType.NOT_FOUND, subdomain: subdomain ?? undefined, message:"" }} />;
  }

  if(store?.storeFront?.status === StoreFrontStatus.INACTIVE){
    return <StoreErrorComponent error={{ type: StoreErrorType.INACTIVE, subdomain: subdomain ?? undefined, message:"" }} />;
  }
   */

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
