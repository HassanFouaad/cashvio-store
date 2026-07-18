/**
 * Format currency based on currency code
 * Automatically detects locale from the current language
 */
export function formatCurrency(
  amount: number,
  currency: string = "EGP",
  locale?: string
): string {
  // If no locale provided, try to detect from document lang or default to en-US
  const detectedLocale =
    locale ||
    (typeof document !== "undefined"
      ? document.documentElement.lang
      : "en-US") ||
    "en-US";

  // Map language codes to proper locales for currency formatting
  const localeMap: Record<string, string> = {
    ar: "ar-EG",
    en: "en-US",
  };

  const finalLocale = localeMap[detectedLocale] || detectedLocale;

  return new Intl.NumberFormat(finalLocale, {
    style: "currency",
    currency,
  }).format(amount);
}

