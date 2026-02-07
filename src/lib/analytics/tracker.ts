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

interface BufferedEvent {
  type: "event" | "pageview";
  eventName?: AnalyticsEventName;
  data: Record<string, unknown>;
}

/**
 * Central analytics tracker that dispatches events to all registered adapters.
 *
 * Uses the adapter pattern for scalability:
 * - Adding a new provider (TikTok, Snapchat, etc.) only requires a new adapter.
 * - Event tracking code throughout the app remains unchanged.
 *
 * Includes an event buffer: if events are tracked before adapters are registered
 * (race condition during SSR hydration), they are queued and flushed once
 * the first adapter registers.
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
  private eventBuffer: BufferedEvent[] = [];
  private static readonly MAX_BUFFER_SIZE = 50;

  /**
   * Register a new analytics adapter.
   * After registration, any buffered events are flushed to the new adapter.
   */
  registerAdapter(adapter: AnalyticsAdapter): void {
    // Prevent duplicate registrations
    if (this.adapters.some((a) => a.name === adapter.name)) {
      return;
    }
    this.adapters.push(adapter);
    this.initialized = true;

    // Flush buffered events to all adapters
    this.flushBuffer();
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
    this.eventBuffer = [];
  }

  /**
   * Flush buffered events to all registered adapters, then clear the buffer.
   */
  private flushBuffer(): void {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    for (const buffered of events) {
      if (buffered.type === "pageview") {
        this.dispatchPageView(buffered.data as PageViewData | undefined);
      } else if (buffered.eventName) {
        this.dispatchEvent(buffered.eventName, buffered.data);
      }
    }
  }

  // ==================== Core Methods ====================

  /**
   * Dispatch a page view to all adapters (no buffering).
   */
  private dispatchPageView(data?: PageViewData): void {
    for (const adapter of this.adapters) {
      try {
        adapter.trackPageView(data);
      } catch {
        // Individual adapter errors are silenced
      }
    }
  }

  /**
   * Dispatch a generic event to all adapters (no buffering).
   */
  private dispatchEvent(
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

  /**
   * Track a page view across all adapters.
   * Buffers if no adapters are registered yet.
   */
  trackPageView(data?: PageViewData): void {
    if (this.adapters.length === 0) {
      if (this.eventBuffer.length < AnalyticsTracker.MAX_BUFFER_SIZE) {
        this.eventBuffer.push({
          type: "pageview",
          data: (data ?? {}) as Record<string, unknown>,
        });
      }
      return;
    }
    this.dispatchPageView(data);
  }

  /**
   * Track a generic event across all adapters.
   * Buffers if no adapters are registered yet.
   */
  trackEvent(
    eventName: AnalyticsEventName,
    data: Record<string, unknown>,
  ): void {
    if (this.adapters.length === 0) {
      if (this.eventBuffer.length < AnalyticsTracker.MAX_BUFFER_SIZE) {
        this.eventBuffer.push({ type: "event", eventName, data });
      }
      return;
    }
    this.dispatchEvent(eventName, data);
  }

  // ==================== E-commerce Convenience Methods ====================

  trackViewItem(data: ViewItemData): void {
    this.trackEvent(
      "view_item",
      data as unknown as Record<string, unknown>,
    );
  }

  trackViewItemList(data: ViewItemListData): void {
    this.trackEvent(
      "view_item_list",
      data as unknown as Record<string, unknown>,
    );
  }

  trackAddToCart(data: AddToCartData): void {
    this.trackEvent(
      "add_to_cart",
      data as unknown as Record<string, unknown>,
    );
  }

  trackRemoveFromCart(data: RemoveFromCartData): void {
    this.trackEvent(
      "remove_from_cart",
      data as unknown as Record<string, unknown>,
    );
  }

  trackViewCart(data: ViewCartData): void {
    this.trackEvent(
      "view_cart",
      data as unknown as Record<string, unknown>,
    );
  }

  trackBeginCheckout(data: BeginCheckoutData): void {
    this.trackEvent(
      "begin_checkout",
      data as unknown as Record<string, unknown>,
    );
  }

  trackPurchase(data: PurchaseData): void {
    this.trackEvent(
      "purchase",
      data as unknown as Record<string, unknown>,
    );
  }

  trackSearch(data: SearchData): void {
    this.trackEvent(
      "search",
      data as unknown as Record<string, unknown>,
    );
  }
}

// Singleton instance
export const analytics = new AnalyticsTracker();
