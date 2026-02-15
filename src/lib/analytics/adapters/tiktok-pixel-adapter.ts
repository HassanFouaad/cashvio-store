import type {
    AnalyticsAdapter,
    AnalyticsEventName,
    PageViewData,
} from "../types";

declare global {
  interface Window {
    ttq?: {
      load: (pixelId: string) => void;
      page: () => void;
      track: (eventName: string, data?: Record<string, unknown>) => void;
      identify: (data: Record<string, unknown>) => void;
    };
    TiktokAnalyticsObject?: string;
  }
}

/**
 * Maps GA4 event names to TikTok Pixel standard events.
 * https://ads.tiktok.com/marketing_api/docs?id=1739585702922241
 */
const TIKTOK_EVENT_MAP: Record<AnalyticsEventName, string | null> = {
  page_view: null, // Handled by ttq.page()
  view_item: "ViewContent",
  view_item_list: "ViewContent",
  add_to_cart: "AddToCart",
  remove_from_cart: null, // No TikTok standard event
  view_cart: null, // No TikTok standard event
  begin_checkout: "InitiateCheckout",
  purchase: "CompletePayment",
  search: "Search",
};

interface QueuedTtqCall {
  method: "track" | "page";
  eventName?: string;
  data?: Record<string, unknown>;
}

/**
 * TikTok Pixel Adapter
 *
 * Translates GA4 e-commerce events to TikTok Pixel standard events.
 * TikTok Pixel uses its own event names and data format.
 *
 * Includes internal queue: if `window.ttq` is not yet available (script
 * loading via afterInteractive), calls are queued and retried with
 * polling (every 200ms for up to 10s).
 *
 * Reference: https://ads.tiktok.com/marketing_api/docs?id=1739585702922241
 *
 * All methods are safe - errors are caught to prevent store crashes.
 */
export class TiktokPixelAdapter implements AnalyticsAdapter {
  readonly name = "tiktok-pixel";
  private readonly pixelId: string;
  private queue: QueuedTtqCall[] = [];
  private flushing = false;
  private static readonly MAX_RETRIES = 50; // 50 * 200ms = 10s
  private static readonly RETRY_INTERVAL_MS = 200;

  constructor(pixelId: string) {
    this.pixelId = pixelId;
  }

  private isTtqReady(): boolean {
    return typeof window !== "undefined" && typeof window.ttq?.track === "function";
  }

  private callTtq(
    method: "track" | "page",
    eventName?: string,
    data?: Record<string, unknown>,
  ): void {
    if (typeof window === "undefined") return;

    if (this.isTtqReady()) {
      if (method === "page") {
        window.ttq!.page();
      } else if (eventName) {
        if (data) {
          window.ttq!.track(eventName, data);
        } else {
          window.ttq!.track(eventName);
        }
      }
    } else {
      this.queue.push({ method, eventName, data });
      this.startFlush();
    }
  }

  /**
   * Poll for `window.ttq` and flush queued calls once it becomes available.
   */
  private startFlush(): void {
    if (this.flushing) return;
    this.flushing = true;

    let retries = 0;
    const interval = setInterval(() => {
      try {
        retries++;
        if (this.isTtqReady()) {
          clearInterval(interval);
          this.flushing = false;
          const calls = [...this.queue];
          this.queue = [];
          for (const call of calls) {
            try {
              if (call.method === "page") {
                window.ttq!.page();
              } else if (call.eventName) {
                if (call.data) {
                  window.ttq!.track(call.eventName, call.data);
                } else {
                  window.ttq!.track(call.eventName);
                }
              }
            } catch {
              // Individual call errors are silenced
            }
          }
        } else if (retries >= TiktokPixelAdapter.MAX_RETRIES) {
          clearInterval(interval);
          this.flushing = false;
          this.queue = [];
        }
      } catch {
        clearInterval(interval);
        this.flushing = false;
        this.queue = [];
      }
    }, TiktokPixelAdapter.RETRY_INTERVAL_MS);
  }

  trackPageView(_data?: PageViewData): void {
    try {
      this.callTtq("page");
    } catch {
      // TikTok Pixel errors must never affect the store
    }
  }

  trackEvent(
    eventName: AnalyticsEventName,
    data: Record<string, unknown>,
  ): void {
    try {
      const ttEventName = TIKTOK_EVENT_MAP[eventName];
      if (!ttEventName) return;

      const ttData = this.transformData(eventName, data);
      this.callTtq("track", ttEventName, ttData);
    } catch {
      // TikTok Pixel errors must never affect the store
    }
  }

  /**
   * Transform GA4 e-commerce data to TikTok Pixel format.
   * https://ads.tiktok.com/marketing_api/docs?id=1739585702922241
   */
  private transformData(
    eventName: AnalyticsEventName,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const items = data.items as Array<Record<string, unknown>> | undefined;
    const contentIds = items?.map((item) => String(item.item_id)) || [];
    const contents =
      items?.map((item) => ({
        content_id: String(item.item_id),
        content_name: String(item.item_name || ""),
        quantity: (item.quantity as number) || 1,
        price: item.price as number,
      })) || [];

    switch (eventName) {
      case "view_item":
        return {
          content_type: "product",
          content_id: contentIds[0] || "",
          contents,
          value: data.value,
          currency: data.currency,
        };

      case "view_item_list":
        return {
          content_type: "product",
          contents,
        };

      case "add_to_cart":
        return {
          content_type: "product",
          content_id: contentIds[0] || "",
          contents,
          value: data.value,
          currency: data.currency,
        };

      case "begin_checkout":
        return {
          content_type: "product",
          contents,
          value: data.value,
          currency: data.currency,
        };

      case "purchase":
        return {
          content_type: "product",
          contents,
          value: data.value,
          currency: data.currency,
        };

      case "search":
        return {
          query: data.search_term,
        };

      default:
        return data;
    }
  }
}
