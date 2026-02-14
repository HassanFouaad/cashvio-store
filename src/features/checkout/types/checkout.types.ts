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
 * Payment methods available for storefront (online) checkout.
 * Matches backend PaymentMethod - only CASH, ONLINE, RECEIPT for storefront.
 * STORE_CREDIT is not selectable on storefront.
 */
export enum PaymentMethod {
  CASH = 'CASH',
  ONLINE = 'ONLINE',
  RECEIPT = 'RECEIPT',
}

/**
 * Public storefront payment method from API
 */
export interface PublicStorefrontPaymentMethodDto {
  paymentMethod: PaymentMethod;
  sortOrder: number;
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
  deliveryAddress?: OrderPreviewDeliveryAddress;
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
  /** Minimum order value configured for the store (0 means no minimum) */
  minimumOrderValue?: number;
  /** Whether the order total is below the configured minimum order value */
  isBelowMinimumOrder?: boolean;
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

/**
 * Public delivery zone country info (with localized names)
 */
export interface PublicDeliveryZoneCountryInfoDto {
  id: number;
  nameEn: string;
  nameAr: string;
  name: string;
  code: string;
}

/**
 * Public delivery zone city info (with localized names)
 */
export interface PublicDeliveryZoneCityInfoDto {
  id: number;
  nameEn: string;
  nameAr: string;
  name: string;
}

/**
 * Public delivery zone item (flat structure from API)
 */
export interface PublicDeliveryZoneItemDto {
  id: string;
  countryId: number;
  country: PublicDeliveryZoneCountryInfoDto;
  cityId: number;
  city: PublicDeliveryZoneCityInfoDto;
}

/**
 * Public delivery zones response (flat array)
 */
export interface PublicDeliveryZonesResponseDto {
  zones: PublicDeliveryZoneItemDto[];
}

/**
 * Grouped delivery zone city (for UI display)
 */
export interface GroupedDeliveryZoneCityDto {
  id: number;
  name: string;
}

/**
 * Grouped delivery zone country with cities (for UI display)
 */
export interface GroupedDeliveryZoneCountryDto {
  id: number;
  name: string;
  code: string;
  cities: GroupedDeliveryZoneCityDto[];
}

/**
 * Grouped delivery zones (processed for UI)
 */
export interface GroupedDeliveryZonesDto {
  countries: GroupedDeliveryZoneCountryDto[];
}

/**
 * Delivery address for checkout
 */
export interface DeliveryAddress {
  countryId: number | null;
  cityId: number | null;
}

/**
 * Delivery address for order preview request
 * Matches backend CreatePublicOrderDeliveryAddressDto
 */
export interface OrderPreviewDeliveryAddress {
  countryId: number;
  cityId: number;
  contactPhone: string;
  region?: string;
  street?: string;
  building?: string;
  apartment?: string;
  floor?: string;
  zip?: string;
  additionalDetails?: string;
}

/**
 * Order creation request item
 */
export interface CreateOrderItemRequest {
  variantId: string;
  quantity: number;
}

/**
 * Order creation request
 */
export interface CreateOrderRequest {
  storeId: string;
  fulfillmentMethod: FulfillmentMethod;
  items: CreateOrderItemRequest[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  deliveryAddress?: OrderPreviewDeliveryAddress;
  visitorId: string;
  /** Payment method selected by the customer at checkout */
  paymentMethod?: PaymentMethod;
  /** S3 file key for receipt image when paymentMethod is RECEIPT */
  receiptFileKey?: string;
}

/**
 * Order creation response
 */
export interface OrderCreatedResponse {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  fulfillmentMethod: FulfillmentMethod;
  createdAt: string;
}

/**
 * Common country from the public common API (fallback when no delivery zones)
 */
export interface CommonCountryDto {
  id: number;
  nameEn: string;
  nameAr: string | null;
  nameFr: string | null;
  code: string;
  name?: string;
}

/**
 * Common city from the public common API (fallback when no delivery zones)
 */
export interface CommonCityDto {
  id: number;
  nameEn: string;
  nameAr: string | null;
  nameFr: string | null;
  code: string;
  countryId: number;
  name?: string;
}