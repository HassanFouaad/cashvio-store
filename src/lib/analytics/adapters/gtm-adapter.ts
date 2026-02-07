import type {
  AnalyticsAdapter,
  AnalyticsEventName,
  PageViewData,
} from "../types";

/**
 * Google Tag Manager Adapter
 *
 * Pushes events to the GTM dataLayer using GA4 e-commerce format.
 * GTM handles forwarding to Google Analytics, Google Ads, etc.
 * based on the container's tag configuration.
 *
 * Event format follows GA4 Enhanced E-commerce:
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 *
 * All methods are safe - errors are caught to prevent store crashes.
 *
 * Note: Window.dataLayer type is declared by @next/third-parties.
 */
export class GtmAdapter implements AnalyticsAdapter {
  readonly name = "gtm";

  private pushToDataLayer(data: Record<string, unknown>): void {
    if (typeof window === "undefined") return;

    const win = window as Window & { dataLayer?: object[] };
    win.dataLayer = win.dataLayer || [];
    win.dataLayer.push(data);
  }

  trackPageView(data?: PageViewData): void {
    try {
      this.pushToDataLayer({
        event: "page_view",
        page_title: data?.page_title,
        page_location:
          data?.page_location ||
          (typeof window !== "undefined" ? window.location.href : undefined),
      });
    } catch {
      // GTM errors must never affect the store
    }
  }

  trackEvent(
    eventName: AnalyticsEventName,
    data: Record<string, unknown>,
  ): void {
    try {
      // Clear previous ecommerce data to prevent contamination
      this.pushToDataLayer({ ecommerce: null });

      this.pushToDataLayer({
        event: eventName,
        ecommerce: data,
      });
    } catch {
      // GTM errors must never affect the store
    }
  }
}
