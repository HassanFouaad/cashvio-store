
/**
 * DTO for tracking a visitor visit
 */
export interface TrackVisitorParams {
    storeId: string;
    visitorId: string;
    fingerprint?: string;
    userAgent?: string;
    language?: string;
  }
  