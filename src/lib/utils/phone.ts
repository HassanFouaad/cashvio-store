/**
 * Phone validation helpers for storefront inputs.
 * Egypt mobile numbers are validated strictly; other countries keep a
 * permissive international check (leading + and ≥10 digits).
 */

/** Egyptian mobile: +20 + 1 + [0125] + 8 digits (e.g. +201012345678). */
const EGYPT_MOBILE_PATTERN = /^\+201[0125]\d{8}$/;

/**
 * Returns true when the sanitized E.164-ish phone is valid for the
 * selected country ISO2 code.
 */
export function isValidPhoneForCountry(
  phone: string,
  countryIso2: string,
): boolean {
  if (!phone.startsWith('+')) {
    return false;
  }

  if (countryIso2.toLowerCase() === 'eg') {
    return EGYPT_MOBILE_PATTERN.test(phone);
  }

  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10;
}
