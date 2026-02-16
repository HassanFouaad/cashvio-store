"use client";

import { trackVisitor } from "@/features/visitors/api/track-visitor";
import { useVisitor } from "@/providers/visitor-provider";
import { useEffect, useRef } from "react";

const SESSION_TRACKED_KEY = "sf_visit_tracked";

interface VisitorTrackerProps {
  storeId: string;
}

/**
 * Component that tracks visitor visits
 * Should be placed in the store layout
 *
 * Deduplication:
 * - sessionStorage persists across soft navigations and full page refreshes
 *   but resets when the browser tab is closed, giving exactly one track per session.
 * - useRef guards against React strict mode double-effects within the same render.
 */
export function VisitorTracker({ storeId }: VisitorTrackerProps) {
  const { visitor, isLoading } = useVisitor();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !visitor || trackedRef.current) {
      return;
    }

    // Check sessionStorage - survives page navigations within the same tab
    try {
      if (sessionStorage.getItem(SESSION_TRACKED_KEY)) {
        return;
      }
    } catch {
      // sessionStorage may be unavailable (e.g. private mode in some browsers)
    }

    // Mark as tracked immediately to prevent duplicate calls
    trackedRef.current = true;

    trackVisitor({
      storeId,
      visitorId: visitor.visitorId,
      fingerprint: visitor.fingerprint || undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      language:
        typeof navigator !== "undefined" ? navigator.language : undefined,
    }).then(() => {
      try {
        sessionStorage.setItem(SESSION_TRACKED_KEY, "1");
      } catch {
        // silent
      }
    });
  }, [storeId, visitor, isLoading]);

  return null;
}
