/**
 * Analytics Event Types
 * 
 * Uses GA4-standard event names as the canonical format.
 * Each analytics adapter translates these to its native format.
 * This keeps event tracking code provider-agnostic.
 */

// Standard e-commerce event names (GA4 standard)
export type AnalyticsEventName =
  | 'page_view'
  | 'view_item'
  | 'view_item_list'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'search';

/**
 * E-commerce item matching GA4 standard
 */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
  currency?: string;
  item_variant?: string;
}

// ==================== Event Data Payloads ====================

export interface PageViewData {
  page_title?: string;
  page_location?: string;
}

export interface ViewItemData {
  currency: string;
  value: number;
  items: AnalyticsItem[];
}

export interface ViewItemListData {
  item_list_id?: string;
  item_list_name?: string;
  items: AnalyticsItem[];
}

export interface AddToCartData {
  currency: string;
  value: number;
  items: AnalyticsItem[];
}

export interface RemoveFromCartData {
  currency: string;
  value: number;
  items: AnalyticsItem[];
}

export interface ViewCartData {
  currency: string;
  value: number;
  items: AnalyticsItem[];
}

export interface BeginCheckoutData {
  currency: string;
  value: number;
  items: AnalyticsItem[];
}

export interface PurchaseData {
  transaction_id: string;
  currency: string;
  value: number;
  items: AnalyticsItem[];
  shipping?: number;
}

export interface SearchData {
  search_term: string;
}

// ==================== Analytics Adapter Interface ====================

/**
 * Interface for analytics provider adapters.
 * Implement this to add new analytics providers (e.g., TikTok Pixel, Snapchat).
 */
export interface AnalyticsAdapter {
  /** Unique name for this adapter */
  name: string;

  /** Track a standard e-commerce event */
  trackEvent(eventName: AnalyticsEventName, data: Record<string, unknown>): void;

  /** Track a page view */
  trackPageView(data?: PageViewData): void;
}
