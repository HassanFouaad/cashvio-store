import { Locale } from "@/types/enums";

const AMOUNT_FORMATTERS = new Map<string, Intl.NumberFormat>();
const ARABIC_CURRENCY_NAMES = new Intl.DisplayNames(Locale.ARABIC, {
  type: "currency",
});

export function isArabicCurrencyLocale(locale: string): boolean {
  return locale.split("-")[0].toLowerCase() === Locale.ARABIC;
}

export function formatCurrencyAmount(
  amount: number,
  currency: string,
  showPlusSign = false,
): string {
  const code = currency.toUpperCase();
  let formatter = AMOUNT_FORMATTERS.get(code);
  if (!formatter) {
    const { maximumFractionDigits } = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).resolvedOptions();
    formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: maximumFractionDigits,
      maximumFractionDigits,
      trailingZeroDisplay: "stripIfInteger",
    });
    AMOUNT_FORMATTERS.set(code, formatter);
  }

  const formattedAmount = formatter.format(amount);
  return showPlusSign && amount > 0 ? `+${formattedAmount}` : formattedAmount;
}

export function getCurrencyLabel(currency: string, locale: string): string {
  const code = currency.toUpperCase();
  return isArabicCurrencyLocale(locale)
    ? (ARABIC_CURRENCY_NAMES.of(code) ?? code)
    : code;
}

/** Plain-text counterpart for translated messages, native selects and metadata. */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = typeof document !== "undefined"
    ? document.documentElement.lang
    : Locale.ENGLISH,
  showPlusSign = false,
): string {
  const formattedAmount = formatCurrencyAmount(amount, currency, showPlusSign);
  // Keep signs with their digits when interpolating into Arabic copy.
  const displayAmount =
    isArabicCurrencyLocale(locale) && /^[+-]/.test(formattedAmount)
      ? `\u2066${formattedAmount}\u2069`
      : formattedAmount;
  return `${displayAmount}\u00a0${getCurrencyLabel(currency, locale)}`;
}
