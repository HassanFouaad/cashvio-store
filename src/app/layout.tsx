import { LocaleInitializer } from "@/components/locale-initializer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { VisitorTracker } from "@/components/visitor-tracker";
import { appConfig, validateEnvironment } from "@/config/env.config";
import { CartInitializer } from "@/features/cart/components";
import { StoreFooter } from "@/features/store/components/store-footer";
import { StoreHeader } from "@/features/store/components/store-header";
import { StoreFrontStatus } from "@/features/store/types/store.types";
import { AnalyticsProvider } from "@/lib/analytics";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { setApiLocale } from "@/lib/api/types";
import { QueryProvider } from "@/providers/query-provider";
import { StoreProvider } from "@/providers/store-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { VisitorProvider } from "@/providers/visitor-provider";
import {
  getDirectionForLocale,
  getFontFamilyForLocale,
  isValidLocale,
  Locale,
  Theme,
} from "@/types/enums";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Cairo, Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";

// Validate environment on startup
if (appConfig.isDevelopment) {
  validateEnvironment();
}

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export async function generateMetadata(): Promise<Metadata> {
  // Resolve store and set API context (critical for X-Store-Id header)
  const { store, subdomain } = await resolveRequestStore();

  // If no store subdomain, return default metadata
  if (!subdomain) {
    return {
      title: appConfig.name,
      description: "Multi-tenant e-commerce storefront",
      icons: {
        icon: "/favicon.svg",
      },
    };
  }

  if (
    !store ||
    !store.storeFront ||
    store.storeFront.status !== StoreFrontStatus.ACTIVE
  ) {
    const tErrors = await getTranslations("errors.storeNotFound");
    return {
      title: tErrors("title"),
      description: tErrors("description"),
      icons: {
        icon: "/favicon.svg",
      },
    };
  }

  const seo = store.storeFront.seo;
  const storeName = store.name;
  const storeDescription = seo?.description || `Welcome to ${storeName}`;

  // Favicon fallback chain: tenant favicon > store logo > default
  const faviconUrl = seo?.favIcon || store.storeFront.logoUrl || "/favicon.svg";

  // OG image: use hero image if available, otherwise favicon/logo
  const ogImage =
    store.storeFront.heroImages?.[0]?.imageUrl ||
    seo?.favIcon ||
    store.storeFront.logoUrl ||
    undefined;

  const metadata: Metadata = {
    title: {
      default: seo?.title || storeName,
      template: `%s | ${storeName}`,
    },
    description: storeDescription,
    icons: {
      icon: [
        { url: faviconUrl, type: "image/png" },
        { url: faviconUrl, sizes: "32x32", type: "image/png" },
        { url: faviconUrl, sizes: "16x16", type: "image/png" },
      ],
      shortcut: [{ url: faviconUrl }],
      apple: [{ url: faviconUrl, sizes: "180x180" }],
    },
    openGraph: {
      type: "website",
      siteName: storeName,
      title: seo?.title || storeName,
      description: storeDescription,
      ...(ogImage
        ? {
            images: [
              { url: ogImage, width: 1200, height: 630, alt: storeName },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.title || storeName,
      description: storeDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    metadataBase: subdomain
      ? new URL(`https://${(await headers()).get("host") || subdomain}`)
      : new URL(appConfig.baseUrl),
  };

  return metadata;
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // For safe area on iOS
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeString = await getLocale();
  const locale = isValidLocale(localeString) ? localeString : Locale.ENGLISH;
  const messages = await getMessages();

  // Set locale for server-side API calls
  setApiLocale(locale);

  const direction = getDirectionForLocale(locale);
  const fontFamily = getFontFamilyForLocale(locale);

  // Resolve store and set API context (cached — shares result with generateMetadata)
  const { store, subdomain: storeSubdomain } = await resolveRequestStore();

  // Get visitor ID from cookie (set by middleware)
  const cookieStore = await cookies();
  const visitorId = cookieStore.get("sf_visitor_id")?.value;

  // Inline script to set store ID in window and cookie IMMEDIATELY
  // This runs BEFORE React hydrates, ensuring store ID is available
  const storeIdScript = store?.id
    ? `
    (function(){
      window.__STORE_ID__ = '${store.id}';
      document.cookie = 'sf_store_id=' + encodeURIComponent('${store.id}') + '; path=/; max-age=31536000; samesite=lax';
    })();
  `
    : null;

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        {/* Set store ID cookie BEFORE React hydrates */}
        {storeIdScript && (
          <script dangerouslySetInnerHTML={{ __html: storeIdScript }} />
        )}
      </head>
      <body
        className={`${inter.variable} ${cairo.variable} ${fontFamily} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <StoreProvider
            store={store ?? null}
            subdomain={storeSubdomain ?? null}
          >
            <LocaleInitializer />
            <ThemeProvider
              attribute="class"
              defaultTheme={Theme.LIGHT}
              enableSystem
              disableTransitionOnChange
            >
              <VisitorProvider initialVisitorId={visitorId}>
                <QueryProvider>
                  {store ? (
                    <div className="flex min-h-screen flex-col">
                      {/* Initialize cart store with store info - renders nothing */}
                      <CartInitializer />
                      <VisitorTracker storeId={store.id} />
                      {/* Analytics: GTM + Facebook Pixel (per-tenant configuration) */}
                      <AnalyticsProvider
                        gtmId={store.storeFront?.webEvents?.gtmId}
                        facebookPixelId={
                          store.storeFront?.webEvents?.facebookPixelId
                        }
                      />
                      <StoreHeader store={store} />
                      <main className="flex-1">{children}</main>
                      {/* Footer - hidden on mobile, shown on desktop */}
                      <div className="hidden md:block">
                        <StoreFooter store={store} />
                      </div>
                      {/* Mobile Bottom Navigation - only on mobile */}
                      <MobileBottomNav
                        socialMedia={store.storeFront?.socialMedia}
                        storeName={store.name}
                      />
                    </div>
                  ) : (
                    children
                  )}
                </QueryProvider>
              </VisitorProvider>
            </ThemeProvider>
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
