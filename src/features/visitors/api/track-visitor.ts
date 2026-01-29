"use server";

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { ApiException } from "@/lib/api/types";
import { TrackVisitorParams } from "../types/visitor.types";

/**
 * Track visitor visit - fire and forget
 * Returns void (backend returns 204 No Content)
 */
export async function trackVisitor(params: TrackVisitorParams): Promise<void> {
  try {
    await apiClient.postNoContent(endpoints.visitors.track, params);
  } catch (error) {
    // Silent fail in production - tracking should not break the app
    if (process.env.NODE_ENV === "development") {
      if (error instanceof ApiException) {
        console.error("[Visitor Tracking] API Error:", error.message);
      } else {
        console.error("[Visitor Tracking] Error:", error);
      }
    }
    // Don't rethrow - tracking failures should be silent
  }
}
