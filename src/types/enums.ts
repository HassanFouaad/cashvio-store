/**
 * Application-wide enums
 * Centralized location for all enum values
 */

/**
 * Supported locales/languages
 */
export enum Locale {
  ENGLISH = 'en',
  ARABIC = 'ar',
}

/**
 * Theme modes
 */
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/**
 * Text direction
 */
export enum Direction {
  LTR = 'ltr',
  RTL = 'rtl',
}

/**
 * Cookie names
 */
export enum CookieName {
  LOCALE = 'NEXT_LOCALE',
  THEME = 'theme',
}

/**
 * Font families
 */
export enum FontFamily {
  INTER = 'font-sans',
  CAIRO = 'font-cairo',
}

/**
 * Helper function to get all locale values as array
 */
export const getAllLocales = (): Locale[] => {
  return Object.values(Locale);
};

/**
 * Helper function to check if a string is a valid locale
 */
export const isValidLocale = (value: string): value is Locale => {
  return Object.values(Locale).includes(value as Locale);
};

/**
 * Helper function to get direction for a locale
 */
export const getDirectionForLocale = (locale: Locale): Direction => {
  return locale === Locale.ARABIC ? Direction.RTL : Direction.LTR;
};

/**
 * Helper function to get font family for a locale
 */
export const getFontFamilyForLocale = (locale: Locale): FontFamily => {
  return locale === Locale.ARABIC ? FontFamily.CAIRO : FontFamily.INTER;
};
