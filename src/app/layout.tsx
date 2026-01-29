import { DynamicFavicon } from "@/components/dynamic-favicon";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { VisitorTracker } from "@/components/visitor-tracker";
import { appConfig, validateEnvironment } from "@/config/env.config";
import { CartInitializer } from "@/features/cart/components";
import { getStoreWithErrorHandling } from "@/features/store/api/get-store";
import { StoreFooter } from "@/features/store/components/store-footer";
import { StoreHeader } from "@/features/store/components/store-header";
import { StoreFrontStatus } from "@/features/store/types/store.types";
import { getStoreCode } from "@/features/store/utils/store-resolver";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { VisitorProvider } from "@/providers/visitor-provider";
import {
  Locale,
  Theme,
  getDirectionForLocale,
  getFontFamilyForLocale,
  isValidLocale,
} from "@/types/enums";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
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
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeCode = getStoreCode(hostname);

  // If no store code, return default metadata
  if (!storeCode) {
    return {
      title: appConfig.name,
      description: "Multi-tenant e-commerce storefront",
    };
  }

  // Get store metadata
  const { store } = await getStoreWithErrorHandling(storeCode);

  if (
    !store ||
    !store.storeFront ||
    store.storeFront.status !== StoreFrontStatus.ACTIVE
  ) {
    return {
      title: "Store Not Found",
      description:
        "The requested store could not be found or is not available.",
    };
  }

  const seo = store.storeFront.seo;

  const metadata: Metadata = {
    title: seo?.title || store.name,
    description: seo?.description || `Welcome to ${store.name}`,
  };

  // Add favicon
  if (seo?.favIcon) {
    metadata.icons = {
      icon: [{ url: seo.favIcon, type: "image/png" }],
      shortcut: [{ url: seo.favIcon, type: "image/png" }],
      apple: [{ url: seo.favIcon, sizes: "180x180", type: "image/png" }],
    };

    metadata.openGraph = {
      title: seo?.title || store.name,
      description: seo?.description || `Welcome to ${store.name}`,
      images: seo.favIcon,
    };
  } else {
    metadata.icons = {
      icon: "/favicon.ico",
    };
  }

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

  const direction = getDirectionForLocale(locale);
  const fontFamily = getFontFamilyForLocale(locale);

  // Check for store subdomain
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeCode = getStoreCode(hostname);

  // Get visitor ID from cookie (set by middleware)
  const cookieStore = await cookies();
  const visitorId = cookieStore.get("sf_visitor_id")?.value;

  // Get store data if subdomain exists
  let store = null;
  if (storeCode) {
    const result = await getStoreWithErrorHandling(storeCode);
    store = result.store;
  }

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cairo.variable} ${fontFamily} antialiased`}
        suppressHydrationWarning
      >
        {store && (
          <DynamicFavicon faviconUrl={store.storeFront?.seo?.favIcon} />
        )}
        <NextIntlClientProvider messages={messages} locale={locale}>
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
                    <CartInitializer storeId={store.id} currency={store.currency} />
                    <VisitorTracker storeId={store.id} />
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
