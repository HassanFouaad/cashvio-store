/**
 * Cart types for storefront
 */

import { ApiCart, ApiCartItem } from '../api/cart.types';

// Re-export API types for convenience
export type { ApiCart, ApiCartItem };

/**
 * Store order payment settings (public endpoint).
 * Matches backend StoreOrderPaymentSettingsDto.
 */
export interface StoreOrderPaymentSettingsDto {
  id: string;
  storeId: string;
  /** Minimum order value required for this store (0 = no minimum) */
  minimumOrderValue: number;
  /** Order subtotal at which delivery becomes free (0 = disabled) */
  freeDeliveryThreshold: number;
}

/**
 * Order-related store settings consumed by cart/checkout UI nudges.
 */
export interface CartOrderSettings {
  minimumOrderValue: number;
  freeDeliveryThreshold: number;
}
