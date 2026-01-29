"use client";

import { trackVisitor } from "@/features/visitors/api/track-visitor";
import { useVisitor } from "@/providers/visitor-provider";
import { useEffect, useRef } from "react";

interface VisitorTrackerProps {
  storeId: string;
}

/**
 * Component that tracks visitor visits
 * Should be placed in the store layout
 */
export function VisitorTracker({ storeId }: VisitorTrackerProps) {
  const { visitor, isLoading } = useVisitor();
  const trackedRef = useRef(false);

  useEffect(() => {
    // Skip if loading, no visitor data, or already tracked this session
    if (isLoading || !visitor || trackedRef.current) {
      return;
    }

    // Mark as tracked immediately to prevent duplicate calls
    trackedRef.current = true;

    // Track the visit using server action
    trackVisitor({
      storeId,
      visitorId: visitor.visitorId,
      fingerprint: visitor.fingerprint || undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      language: typeof navigator !== "undefined" ? navigator.language : undefined,
    });
  }, [storeId, visitor, isLoading]);

  // This component doesn't render anything
  return null;
}
