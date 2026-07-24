/**
 * Order tracking types — mirror backend public tracking DTOs
 */

import { FulfillmentMethod } from "@/features/checkout/types/checkout.types";

/**
 * Order status (public subset)
 */
export enum OrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/**
 * Fulfillment lifecycle status
 */
export enum FulfillmentStatus {
  PENDING = "PENDING",
  PREPARING = "PREPARING",
  READY = "READY",
  DELIVERING = "DELIVERING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/**
 * Payment status (public subset)
 */
export enum PaymentStatus {
  PENDING = "PENDING",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
}

/**
 * Tracking lookup request
 */
export interface TrackOrderRequest {
  orderNumber: string;
  phone: string;
}

/**
 * Public-safe order item for tracking display
 */
/** Selected modifier snapshot on a tracked order item */
export interface PublicOrderTrackingItemModifierDto {
  modifierId: string;
  modifierGroupId: string;
  groupName: string;
  name: string;
  priceDelta: number;
}

export interface PublicOrderTrackingItemDto {
  productName: string;
  variantName: string;
  quantity: number;
  lineTotal: number;
  modifiers?: PublicOrderTrackingItemModifierDto[] | null;
}

/**
 * Public-safe order tracking response
 */
export interface PublicOrderTrackingDto {
  /** Order ID — used by payment retry flows */
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentMethod: FulfillmentMethod;
  paymentStatus: PaymentStatus;
  /** Payment method chosen at checkout */
  paymentMethod?: string;
  orderDate: string;
  subtotal: number;
  totalDiscount: number;
  deliveryFees: number;
  serviceFees: number;
  /** Signed gateway payment fee included in totalAmount */
  paymentFees: number;
  totalTax: number;
  totalAmount: number;
  currency: string;
  items: PublicOrderTrackingItemDto[];
}
