/**
 * Public-safe pickup location fields for checkout / order-success.
 */
export interface StorePickupLocation {
  storeName: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  cityName?: string | null;
  countryName?: string | null;
  postalCode?: string | null;
  contactPhone?: string | null;
}

/**
 * True when at least one address line or place name is present.
 */
export function hasPickupAddressLines(location: StorePickupLocation): boolean {
  return Boolean(
    location.addressLine1?.trim() ||
      location.addressLine2?.trim() ||
      location.cityName?.trim() ||
      location.countryName?.trim() ||
      location.postalCode?.trim(),
  );
}

/**
 * Ordered display lines for a pickup location (non-empty only).
 * City + country are joined on one line when both exist.
 */
export function formatPickupAddressLines(
  location: StorePickupLocation,
): string[] {
  const lines: string[] = [];

  const line1 = location.addressLine1?.trim();
  if (line1) lines.push(line1);

  const line2 = location.addressLine2?.trim();
  if (line2) lines.push(line2);

  const city = location.cityName?.trim();
  const country = location.countryName?.trim();
  const postal = location.postalCode?.trim();

  const placeParts = [city, postal].filter(Boolean);
  if (placeParts.length > 0 && country) {
    lines.push(`${placeParts.join(" ")} · ${country}`);
  } else if (placeParts.length > 0) {
    lines.push(placeParts.join(" "));
  } else if (country) {
    lines.push(country);
  }

  return lines;
}
