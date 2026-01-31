/**
 * Checkout-related types for storefront
 * Following application patterns for type definitions
 */

/**
 * Fulfillment methods available for storefront
 * IN_STORE is internal only, not available for online orders
 */
export enum FulfillmentMethod {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  DINE_IN = 'DINE_IN',
}

/**
 * Public fulfillment method from API
 */
export interface PublicFulfillmentMethodDto {
  fulfillmentMethod: FulfillmentMethod;
  isActive: boolean;
}

/**
 * Order preview request item
 */
export interface PreviewOrderItemRequest {
  variantId: string;
  quantity: number;
}

/**
 * Order preview request
 */
export interface CreateOrderPreviewRequest {
  storeId: string;
  fulfillmentMethod: FulfillmentMethod;
  items: PreviewOrderItemRequest[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

/**
 * Order preview item response
 */
export interface OrderPreviewItem {
  variantId: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  lineDiscount: number;
  lineTax: number;
  lineTotal: number;
  productName: string;
  variantName: string;
  productSku: string;
  variantAttributes?: Record<string, unknown>;
}

/**
 * Order preview response
 */
export interface OrderPreviewResponse {
  storeId: string;
  currency: string;
  fulfillmentMethod: FulfillmentMethod;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  serviceFees: number;
  deliveryFees: number;
  totalAmount: number;
  items: OrderPreviewItem[];
}

/**
 * Customer information for checkout
 */
export interface CheckoutCustomerInfo {
  name: string;
  phone: string;
  notes?: string;
}

/**
 * Checkout state
 */
export interface CheckoutState {
  fulfillmentMethod: FulfillmentMethod | null;
  customerInfo: CheckoutCustomerInfo;
  preview: OrderPreviewResponse | null;
  isLoading: boolean;
  error: string | null;
}
