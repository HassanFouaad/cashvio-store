"use client";

import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";
import { useEffect, useRef } from "react";

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
 * Place this component in the root layout. It reads web events config
 * from the store data and conditionally initializes only the providers
 * that the tenant has configured.
 *
 * All initialization is wrapped in try-catch to ensure analytics
 * never crash the store front.
 */
export function AnalyticsProvider({
  gtmId,
  facebookPixelId,
}: AnalyticsProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      // Reset previous adapters (in case of re-render with different store)
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
  }, [gtmId, facebookPixelId]);

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
