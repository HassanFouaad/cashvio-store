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

/**
 * Format date to localized string
 */
export function formatDate(
  date: Date | string,
  locale: string = "en-US",
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Format based on length (basic US format)
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  }

  return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
