"use client";

import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";
import { useRef } from "react";

import { FacebookPixelAdapter } from "./adapters/facebook-pixel-adapter";
import { GtmAdapter } from "./adapters/gtm-adapter";
import { TiktokPixelAdapter } from "./adapters/tiktok-pixel-adapter";
import { analytics } from "./tracker";

interface AnalyticsProviderProps {
  gtmId?: string | null;
  facebookPixelId?: string | null;
  tiktokPixelId?: string | null;
}

/**
 * AnalyticsProvider initializes analytics adapters and injects tracking scripts.
 *
 * - Renders GTM script via @next/third-parties (optimal Next.js integration)
 * - Renders Facebook Pixel script via next/script
 * - Renders TikTok Pixel script via next/script
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
  tiktokPixelId,
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

      if (tiktokPixelId) {
        analytics.registerAdapter(new TiktokPixelAdapter(tiktokPixelId));
      }
    } catch {
      // Analytics initialization must never crash the store
    }
  }

  const hasGtm = !!gtmId;
  const hasFbPixel = !!facebookPixelId;
  const hasTtPixel = !!tiktokPixelId;

  // Don't render anything if no analytics are configured
  if (!hasGtm && !hasFbPixel && !hasTtPixel) {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager via @next/third-parties */}
      {hasGtm && <GoogleTagManager gtmId={gtmId} />}

      {/* Facebook Pixel */}
      {hasFbPixel && (
        <>
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
          {/* Facebook Pixel noscript fallback for non-JS tracking */}
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${facebookPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* TikTok Pixel */}
      {hasTtPixel && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off",
              "once","ready","alias","group","enableCookie","disableCookie","holdConsent",
              "revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=
              function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;
              n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){
              var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
              ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},
              ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
              var a=document.createElement("script");a.type="text/javascript",
              a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;
              var s=document.getElementsByTagName("script")[0];
              s.parentNode.insertBefore(a,s)};
              ttq.load('${tiktokPixelId}');
              ttq.page();
              }(window,document,'ttq');
            `,
          }}
        />
      )}
    </>
  );
}
