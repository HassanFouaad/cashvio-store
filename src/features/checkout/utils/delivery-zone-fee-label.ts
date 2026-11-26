import { DeliveryZoneFeeType } from '@/features/checkout/types/checkout.types';
import { formatCurrency } from '@/lib/utils/formatters';

/**
 * Formats a delivery-zone fee for city dropdown labels.
 * Fixed → "+30 EGP"; percentage → "5%"; zero → freeLabel ("Free").
 */
export function formatDeliveryZoneFeeLabel(
  feeType: DeliveryZoneFeeType,
  feeValue: number,
  currency: string,
  freeLabel: string,
  locale: string,
): string {
  if (feeValue === 0) {
    return freeLabel;
  }

  if (feeType === DeliveryZoneFeeType.PERCENTAGE) {
    return `${feeValue}%`;
  }

  return formatCurrency(feeValue, currency, locale, true);
}

/**
 * City option label: "Giza (+30 EGP)" / "Giza (5%)" / "Giza (Free)".
 */
export function formatDeliveryZoneCityOptionLabel(
  cityName: string,
  feeType: DeliveryZoneFeeType,
  feeValue: number,
  currency: string,
  freeLabel: string,
  locale: string,
): string {
  const feeLabel = formatDeliveryZoneFeeLabel(
    feeType,
    feeValue,
    currency,
    freeLabel,
    locale,
  );
  return `${cityName} (${feeLabel})`;
}
