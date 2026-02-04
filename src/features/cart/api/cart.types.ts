/**
 * Cart API types - matches backend PublicCartDto
 */

import { PublicProductVariantDto } from '@/features/products/types/product.types';

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
 * Request to modify cart item
 */
export interface ModifyCartItemRequest {
  visitorId: string;
  variantId: string;
  quantity?: number;
}

