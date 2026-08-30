---
name: store-front-analytics-and-pixels
description: Multi-adapter tracking (Google Tag Manager, Meta Pixel, TikTok Pixel), ecommerce event triggers, and visitor tracking API
---

# Analytics & Conversion Pixels

How to initialize and trigger ecommerce conversion events across Google Tag Manager (GTM), Meta (Facebook) Pixel, and TikTok Pixel using the unified analytics adapter layer.

## When to Use
- Adding tracking pixels from merchant store settings.
- Tracking ecommerce lifecycle events (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`).
- Interacting with the `/public/visitors/track` API.

## Core Rules & Invariants
1. **Multi-Adapter Unified Dispatch**: Always fire events through the unified `analyticsService.trackEvent(...)` rather than calling `fbq()` or `gtag()` directly.
2. **Conditional Activation**: Pixels only initialize if configured in `store.storeFront.webEvents` (GTM ID, Meta Pixel ID, TikTok Pixel ID).
3. **Script Strategy**: Inject analytics scripts with Next.js `next/script` using `strategy="afterInteractive"`.
4. **No Sensitive Data**: Never pass credit card details or unhashed passwords to analytics payloads.

## Step-by-Step Implementation Flow

### Step 1: Analytics Scripts in Root Layout
```tsx
import Script from "next/script";
import { PublicStoreDto } from "@/features/store/types/store.types";

export function StoreAnalyticsScripts({ store }: { store: PublicStoreDto }) {
  const events = store.storeFront?.webEvents;
  if (!events) return null;

  return (
    <>
      {events.googleTagManagerId && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${events.googleTagManagerId}');`,
          }}
        />
      )}
      {events.metaPixelId && (
        <Script
          id="meta-pixel-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${events.metaPixelId}'); fbq('track', 'PageView');`,
          }}
        />
      )}
    </>
  );
}
```

### Step 2: Triggering Ecommerce Events in Client Code
```tsx
"use client";

import { trackEvent } from "@/lib/analytics/tracker";
import { PublicProductDto } from "@/features/products/types/product.types";

export function handleProductView(product: PublicProductDto) {
  trackEvent("view_item", {
    currency: "EGP",
    value: product.variants?.[0]?.price || 0,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.variants?.[0]?.price || 0,
      },
    ],
  });
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```tsx
// ❌ FORBIDDEN — Calling window.fbq directly without adapter checks
window.fbq("track", "Purchase", { value: 100 });

// ✅ REQUIRED — Unified adapter with safe fallback
import { trackEvent } from "@/lib/analytics/tracker";
trackEvent("purchase", { value: 100, currency: "EGP", transaction_id: order.id });
```
