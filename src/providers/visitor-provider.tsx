"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  generateFingerprint,
  getOrCreateVisitorId,
  getStoredFingerprint,
  getStoredVisitorId,
  getVisitorIdFromCookie,
  setVisitorIdCookie,
  storeFingerprint,
  storeVisitorId,
} from "@/lib/visitor/visitor-id";

interface VisitorData {
  visitorId: string;
  fingerprint: string;
  isNewVisitor: boolean;
}

interface VisitorContextValue {
  visitor: VisitorData | null;
  isLoading: boolean;
}

const VisitorContext = createContext<VisitorContextValue>({
  visitor: null,
  isLoading: true,
});

/**
 * Hook to access visitor data
 */
export function useVisitor() {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error("useVisitor must be used within a VisitorProvider");
  }
  return context;
}

interface VisitorProviderProps {
  children: ReactNode;
  initialVisitorId?: string;
}

/**
 * Provider component that initializes and maintains visitor identity
 *
 * Flow:
 * 1. Check for existing visitor ID in cookie
 * 2. If not found, check localStorage (backup)
 * 3. If not found, generate new ID
 * 4. Store in both cookie and localStorage
 * 5. Generate fingerprint using FingerprintJS (async)
 */
export function VisitorProvider({
  children,
  initialVisitorId,
}: VisitorProviderProps) {
  const [visitor, setVisitor] = useState<VisitorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize visitor identification.
    // The middleware mints the cookie on the first response, so by the time
    // this runs the ID already exists — resolution NEVER generates here,
    // keeping cart/checkout/tracking on the exact same ID.
    const initializeVisitor = async () => {
      const existingId =
        initialVisitorId || getVisitorIdFromCookie() || getStoredVisitorId();
      const isNewVisitor = !existingId;
      // Cookies-disabled edge case: the shared resolver generates + heals
      const visitorId = existingId ?? getOrCreateVisitorId();

      // Always heal both storages so every consumer resolves the same ID
      setVisitorIdCookie(visitorId);
      storeVisitorId(visitorId);

      // Generate or retrieve fingerprint (use cached if available)
      let fingerprint = getStoredFingerprint();
      if (!fingerprint) {
        // Generate fingerprint using FingerprintJS (async)
        fingerprint = await generateFingerprint();
        if (fingerprint) {
          storeFingerprint(fingerprint);
        }
      }

      setVisitor({
        visitorId,
        fingerprint: fingerprint || "",
        isNewVisitor,
      });
      setIsLoading(false);
    };

    initializeVisitor();
  }, [initialVisitorId]);

  return (
    <VisitorContext.Provider value={{ visitor, isLoading }}>
      {children}
    </VisitorContext.Provider>
  );
}
