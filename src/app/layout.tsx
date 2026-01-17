import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { validateEnvironment, appConfig } from '@/config/env.config';
import { 
  Locale, 
  Theme, 
  getDirectionForLocale, 
  getFontFamilyForLocale,
  isValidLocale 
} from '@/types/enums';

// Validate environment on startup
if (appConfig.isDevelopment) {
  validateEnvironment();
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: appConfig.name,
  description: 'Multi-tenant e-commerce storefront',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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

  return (
    <html 
      lang={locale} 
      dir={direction}
      suppressHydrationWarning
    >
      <body 
        className={`${inter.variable} ${cairo.variable} ${fontFamily} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme={Theme.LIGHT}
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>{children}</QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
