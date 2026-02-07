import type {
  AnalyticsAdapter,
  AnalyticsEventName,
  PageViewData,
} from "../types";

declare global {
  interface Window {
    fbq?: (
      ...args: unknown[]
    ) => void;
  }
}

/**
 * Maps GA4 event names to Facebook Pixel standard events.
 * https://developers.facebook.com/docs/meta-pixel/reference
 */
const FB_EVENT_MAP: Record<AnalyticsEventName, string> = {
  page_view: "PageView",
  view_item: "ViewContent",
  view_item_list: "ViewContent",
  add_to_cart: "AddToCart",
  remove_from_cart: "CustomEvent",
  view_cart: "CustomEvent",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  search: "Search",
};

interface QueuedFbCall {
  method: string;
  eventName: string;
  data?: Record<string, unknown>;
}

/**
 * Facebook Pixel Adapter
 *
 * Translates GA4 e-commerce events to Facebook Pixel standard events.
 * Facebook Pixel uses its own event names and data format.
 *
 * Includes internal queue: if `window.fbq` is not yet available (script
 * loading via afterInteractive), calls are queued and retried with
 * polling (every 200ms for up to 10s).
 *
 * Reference: https://developers.facebook.com/docs/meta-pixel/reference
 *
 * All methods are safe - errors are caught to prevent store crashes.
 */
export class FacebookPixelAdapter implements AnalyticsAdapter {
  readonly name = "facebook-pixel";
  private readonly pixelId: string;
  private queue: QueuedFbCall[] = [];
  private flushing = false;
  private static readonly MAX_RETRIES = 50; // 50 * 200ms = 10s
  private static readonly RETRY_INTERVAL_MS = 200;

  constructor(pixelId: string) {
    this.pixelId = pixelId;
  }

  private isFbqReady(): boolean {
    return typeof window !== "undefined" && typeof window.fbq === "function";
  }

  private callFbq(
    method: string,
    eventName: string,
    data?: Record<string, unknown>,
  ): void {
    if (typeof window === "undefined") return;

    if (this.isFbqReady()) {
      if (data) {
        window.fbq!(method, eventName, data);
      } else {
        window.fbq!(method, eventName);
      }
    } else {
      // Queue the call and start flushing
      this.queue.push({ method, eventName, data });
      this.startFlush();
    }
  }

  /**
   * Poll for `window.fbq` and flush queued calls once it becomes available.
   */
  private startFlush(): void {
    if (this.flushing) return;
    this.flushing = true;

    let retries = 0;
    const interval = setInterval(() => {
      try {
        retries++;
        if (this.isFbqReady()) {
          clearInterval(interval);
          this.flushing = false;
          const calls = [...this.queue];
          this.queue = [];
          for (const call of calls) {
            try {
              if (call.data) {
                window.fbq!(call.method, call.eventName, call.data);
              } else {
                window.fbq!(call.method, call.eventName);
              }
            } catch {
              // Individual call errors are silenced
            }
          }
        } else if (retries >= FacebookPixelAdapter.MAX_RETRIES) {
          clearInterval(interval);
          this.flushing = false;
          this.queue = []; // Drop queued events after timeout
        }
      } catch {
        clearInterval(interval);
        this.flushing = false;
        this.queue = [];
      }
    }, FacebookPixelAdapter.RETRY_INTERVAL_MS);
  }

  trackPageView(_data?: PageViewData): void {
    try {
      this.callFbq("track", "PageView");
    } catch {
      // Facebook Pixel errors must never affect the store
    }
  }

  trackEvent(
    eventName: AnalyticsEventName,
    data: Record<string, unknown>,
  ): void {
    try {
      const fbEventName = FB_EVENT_MAP[eventName];
      if (!fbEventName) return;

      // Transform GA4 data to Facebook Pixel format
      const fbData = this.transformData(eventName, data);

      if (fbEventName === "CustomEvent") {
        // Use trackCustom for non-standard events
        this.callFbq("trackCustom", eventName, fbData);
      } else {
        this.callFbq("track", fbEventName, fbData);
      }
    } catch {
      // Facebook Pixel errors must never affect the store
    }
  }

  /**
   * Transform GA4 e-commerce data to Facebook Pixel format
   */
  private transformData(
    eventName: AnalyticsEventName,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const items = data.items as Array<Record<string, unknown>> | undefined;
    const contentIds = items?.map((item) => item.item_id) || [];
    const contentNames = items?.map((item) => item.item_name) || [];
    const numItems =
      items?.reduce(
        (acc, item) => acc + ((item.quantity as number) || 1),
        0,
      ) || 0;

    switch (eventName) {
      case "view_item":
        return {
          content_type: "product",
          content_ids: contentIds,
          content_name: contentNames[0] || "",
          value: data.value,
          currency: data.currency,
        };

      case "view_item_list":
        return {
          content_type: "product",
          content_ids: contentIds,
          contents: items?.map((item) => ({
            id: item.item_id,
            quantity: item.quantity || 1,
          })),
        };

      case "add_to_cart":
        return {
          content_type: "product",
          content_ids: contentIds,
          content_name: contentNames[0] || "",
          value: data.value,
          currency: data.currency,
          num_items: numItems,
        };

      case "begin_checkout":
        return {
          content_type: "product",
          content_ids: contentIds,
          value: data.value,
          currency: data.currency,
          num_items: numItems,
        };

      case "purchase":
        return {
          content_type: "product",
          content_ids: contentIds,
          value: data.value,
          currency: data.currency,
          num_items: numItems,
        };

      case "search":
        return {
          search_string: data.search_term,
        };

      default:
        return data;
    }
  }
}
