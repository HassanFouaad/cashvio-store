/**
 * Build a wa.me deep link from a stored contact phone.
 * Returns null when the phone is missing or has too few digits
 * to be a valid international number.
 */

/** Minimum digits for a plausible international phone number */
const MIN_PHONE_DIGITS = 8;

export function buildWhatsAppLink(
  contactPhone: string | null | undefined,
): string | null {
  if (!contactPhone) return null;

  const digits = contactPhone.replace(/\D/g, "");
  if (digits.length < MIN_PHONE_DIGITS) return null;

  return `https://wa.me/${digits}`;
}
