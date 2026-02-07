"use client";

import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";
import { useRef } from "react";

import { FacebookPixelAdapter } from "./adapters/facebook-pixel-adapter";
import { GtmAdapter } from "./adapters/gtm-adapter";
import { analytics } from "./tracker";

interface AnalyticsProviderProps {
  gtmId?: string | null;
  facebookPixelId?: string | null;
}

/**
 * AnalyticsProvider initializes analytics adapters and injects tracking scripts.
 *
 * - Renders GTM script via @next/third-parties (optimal Next.js integration)
 * - Renders Facebook Pixel script via next/script
 * - Registers adapters with the central analytics tracker
 *
 * Adapter registration runs synchronously during the first render (via useRef
 * guard) so that events fired in sibling useEffect hooks are never lost.
 * Previously, registration was in a useEffect which caused a race condition
 * where events could fire before adapters were ready.
 *
 * All initialization is wrapped in try-catch to ensure analytics
 * never crash the store front.
 */
export function AnalyticsProvider({
  gtmId,
  facebookPixelId,
}: AnalyticsProviderProps) {
  const initialized = useRef(false);

  // Register adapters synchronously on first render (not in useEffect)
  // This ensures adapters are ready before any child useEffect fires events.
  if (!initialized.current) {
    initialized.current = true;
    try {
      analytics.reset();

      if (gtmId) {
        analytics.registerAdapter(new GtmAdapter());
      }

      if (facebookPixelId) {
        analytics.registerAdapter(new FacebookPixelAdapter(facebookPixelId));
      }
    } catch {
      // Analytics initialization must never crash the store
    }
  }

  const hasGtm = !!gtmId;
  const hasPixel = !!facebookPixelId;

  // Don't render anything if no analytics are configured
  if (!hasGtm && !hasPixel) {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager via @next/third-parties */}
      {hasGtm && <GoogleTagManager gtmId={gtmId} />}

      {/* Facebook Pixel */}
      {hasPixel && (
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${facebookPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
    </>
  );
}
