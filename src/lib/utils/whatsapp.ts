/**
 * Build a wa.me deep link from a stored contact phone.
 * Returns null when the phone is missing or has too few digits
 * to be a valid international number.
 */

/** Minimum digits for a plausible international phone number */
const MIN_PHONE_DIGITS = 8;

/**
 * Structural shape of the store's social settings used for WhatsApp —
 * matches StoreFrontSocialMediaDto without importing feature types.
 * Optional fields keep stale cached payloads (without the new columns) safe.
 */
interface WhatsAppContactSource {
  whatsappNumber?: string | null;
  contactPhone?: string | null;
  showWhatsappButton?: boolean;
}

export function buildWhatsAppLink(
  contactPhone: string | null | undefined,
): string | null {
  if (!contactPhone) return null;

  const digits = contactPhone.replace(/\D/g, "");
  if (digits.length < MIN_PHONE_DIGITS) return null;

  return `https://wa.me/${digits}`;
}

/**
 * The number customers chat with on WhatsApp: the dedicated WhatsApp
 * number when the merchant set one, otherwise the contact phone.
 */
export function resolveWhatsAppNumber(
  socialMedia: WhatsAppContactSource | null | undefined,
): string | null {
  if (!socialMedia) return null;
  return socialMedia.whatsappNumber ?? socialMedia.contactPhone ?? null;
}

/**
 * Build the store's WhatsApp chat link, honoring the merchant's
 * "show WhatsApp button" toggle. Returns null when WhatsApp is disabled
 * or no usable number exists.
 */
export function buildStoreWhatsAppLink(
  socialMedia: WhatsAppContactSource | null | undefined,
): string | null {
  if (!socialMedia || socialMedia.showWhatsappButton === false) return null;
  return buildWhatsAppLink(resolveWhatsAppNumber(socialMedia));
}
