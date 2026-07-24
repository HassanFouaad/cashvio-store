/**
 * Cart API types - matches backend PublicCartDto
 */

import { PublicProductVariantDto } from '@/features/products/types/product.types';

/**
 * Selected modifier on a cart line (resolved live from the catalog)
 */
export interface ApiCartItemModifier {
  modifierId: string;
  groupName: string;
  name: string;
  priceDelta: number;
}

/**
 * Cart item from API response
 */
export interface ApiCartItem {
  id: string;
  quantity: number;
  lineTotal: number;
  variant: PublicProductVariantDto;
  productName?: string;
  imageUrl?: string;
  /** Selected modifiers — same variant with a different set is its own line */
  modifiers?: ApiCartItemModifier[];
}

/**
 * Cart from API response
 */
export interface ApiCart {
  id: string;
  items: ApiCartItem[];
  itemCount: number;
  subtotal: number;
  removedVariantIds?: string[];
}

/**
 * Request to modify cart item.
 * Target a line either by itemId (update/remove) or by
 * variantId + modifierIds (add / same-selection merge).
 */
export interface ModifyCartItemRequest {
  visitorId: string;
  variantId?: string;
  itemId?: string;
  quantity?: number;
  modifierIds?: string[];
}
