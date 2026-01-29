"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  VISITOR_ID_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  generateVisitorId,
  generateFingerprint,
  getStoredVisitorId,
  storeVisitorId,
  getStoredFingerprint,
  storeFingerprint,
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

/**
 * Get visitor ID from cookie (works both client and server)
 */
function getVisitorIdFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === VISITOR_ID_COOKIE) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Set visitor ID cookie
 */
function setVisitorIdCookie(visitorId: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + VISITOR_COOKIE_MAX_AGE * 1000);

  // Set cookie with SameSite=Lax for cross-subdomain support
  document.cookie = `${VISITOR_ID_COOKIE}=${encodeURIComponent(visitorId)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
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
    // Initialize visitor identification
    const initializeVisitor = async () => {
      let visitorId = initialVisitorId || getVisitorIdFromCookie();
      let isNewVisitor = false;

      // Try localStorage if cookie not found
      if (!visitorId) {
        visitorId = getStoredVisitorId();
      }

      // Generate new ID if still not found
      if (!visitorId) {
        visitorId = generateVisitorId();
        isNewVisitor = true;
      }

      // Always ensure ID is stored in both cookie and localStorage
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
