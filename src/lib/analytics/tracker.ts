import type {
    AddToCartData,
    AnalyticsAdapter,
    AnalyticsEventName,
    BeginCheckoutData,
    PageViewData,
    PurchaseData,
    RemoveFromCartData,
    SearchData,
    ViewCartData,
    ViewItemData,
    ViewItemListData,
} from "./types";

/**
 * Central analytics tracker that dispatches events to all registered adapters.
 *
 * Uses the adapter pattern for scalability:
 * - Adding a new provider (TikTok, Snapchat, etc.) only requires a new adapter.
 * - Event tracking code throughout the app remains unchanged.
 *
 * All dispatch methods are wrapped in try-catch to guarantee analytics
 * errors never crash or affect the store front.
 *
 * Usage:
 *   import { analytics } from '@/lib/analytics';
 *   analytics.trackAddToCart({ currency: 'USD', value: 29.99, items: [...] });
 */
class AnalyticsTracker {
  private adapters: AnalyticsAdapter[] = [];
  private initialized = false;

  /**
   * Register a new analytics adapter
   */
  registerAdapter(adapter: AnalyticsAdapter): void {
    // Prevent duplicate registrations
    if (this.adapters.some((a) => a.name === adapter.name)) {
      return;
    }
    this.adapters.push(adapter);
    this.initialized = true;
  }

  /**
   * Check if any adapters are registered
   */
  isInitialized(): boolean {
    return this.initialized && this.adapters.length > 0;
  }

  /**
   * Reset all adapters (useful for testing or store changes)
   */
  reset(): void {
    this.adapters = [];
    this.initialized = false;
  }

  // ==================== Core Methods ====================

  /**
   * Track a page view across all adapters
   */
  trackPageView(data?: PageViewData): void {
    for (const adapter of this.adapters) {
      try {
        adapter.trackPageView(data);
      } catch {
        // Individual adapter errors are silenced
      }
    }
  }

  /**
   * Track a generic event across all adapters
   */
  trackEvent(
    eventName: AnalyticsEventName,
    data: Record<string, unknown>,
  ): void {
    for (const adapter of this.adapters) {
      try {
        adapter.trackEvent(eventName, data);
      } catch {
        // Individual adapter errors are silenced
      }
    }
  }

  // ==================== E-commerce Convenience Methods ====================

  /**
   * Track when a user views a product detail page
   */
  trackViewItem(data: ViewItemData): void {
    this.trackEvent(
      "view_item",
      data as unknown as Record<string, unknown>,
    );
  }

  /**
   * Track when a user views a list of products
   */
  trackViewItemList(data: ViewItemListData): void {
    this.trackEvent(
      "view_item_list",
      data as unknown as Record<string, unknown>,
    );
  }

  /**
   * Track when a user adds an item to cart
   */
  trackAddToCart(data: AddToCartData): void {
    this.trackEvent(
      "add_to_cart",
      data as unknown as Record<string, unknown>,
    );
  }

  /**
   * Track when a user removes an item from cart
   */
  trackRemoveFromCart(data: RemoveFromCartData): void {
    this.trackEvent(
      "remove_from_cart",
      data as unknown as Record<string, unknown>,
    );
  }

  /**
   * Track when a user views their cart
   */
  trackViewCart(data: ViewCartData): void {
    this.trackEvent(
      "view_cart",
      data as unknown as Record<string, unknown>,
    );
  }

  /**
   * Track when a user begins the checkout process
   */
  trackBeginCheckout(data: BeginCheckoutData): void {
    this.trackEvent(
      "begin_checkout",
      data as unknown as Record<string, unknown>,
    );
  }

  /**
   * Track a completed purchase
   */
  trackPurchase(data: PurchaseData): void {
    this.trackEvent(
      "purchase",
      data as unknown as Record<string, unknown>,
    );
  }

  /**
   * Track a search action
   */
  trackSearch(data: SearchData): void {
    this.trackEvent(
      "search",
      data as unknown as Record<string, unknown>,
    );
  }
}

// Singleton instance
export const analytics = new AnalyticsTracker();
