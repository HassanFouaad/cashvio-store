/**
 * Order-success recap persistence.
 *
 * The cart is cleared when an order is placed, so the confirmation page
 * cannot re-derive what was ordered. Checkout stores a small recap in
 * sessionStorage just before redirecting; the confirmation page reads it
 * (refresh-safe within the tab's session).
 */

import type { FulfillmentMethod } from "@/features/checkout/types/checkout.types";
import type { StorePickupLocation } from "@/features/checkout/utils/pickup-location";

const RECAP_KEY = "order-success-recap";

/** Max line items stored in the recap — the rest is summarized as a count */
const MAX_RECAP_ITEMS = 5;

export interface OrderSuccessRecapItem {
  name: string;
  variant: string;
  quantity: number;
}

export interface OrderSuccessRecap {
  orderNumber: string;
  totalAmount: number;
  currency: string;
  items: OrderSuccessRecapItem[];
  moreItemsCount: number;
  fulfillmentMethod?: FulfillmentMethod;
  pickupLocation?: StorePickupLocation;
  /** Table / seat label for DINE_IN orders */
  tableNumber?: string;
  /** Checkout phone — lets the track page prefill the verification field */
  phone?: string;
}

export function saveOrderSuccessRecap(recap: OrderSuccessRecap): void {
  try {
    sessionStorage.setItem(RECAP_KEY, JSON.stringify(recap));
  } catch {
    // sessionStorage unavailable — the page degrades to number-only view
  }
}

export function getOrderSuccessRecap(
  orderNumber: string,
): OrderSuccessRecap | null {
  try {
    const raw = sessionStorage.getItem(RECAP_KEY);
    if (!raw) return null;

    const recap = JSON.parse(raw) as OrderSuccessRecap;
    // Only serve the recap for the order it belongs to
    if (recap.orderNumber !== orderNumber) return null;

    return recap;
  } catch {
    return null;
  }
}

export function buildOrderSuccessRecap(params: {
  orderNumber: string;
  totalAmount: number;
  currency: string;
  items: Array<{ name: string; variant: string; quantity: number }>;
  fulfillmentMethod?: FulfillmentMethod;
  pickupLocation?: StorePickupLocation;
  tableNumber?: string;
  phone?: string;
}): OrderSuccessRecap {
  return {
    orderNumber: params.orderNumber,
    totalAmount: params.totalAmount,
    currency: params.currency,
    items: params.items.slice(0, MAX_RECAP_ITEMS),
    moreItemsCount: Math.max(0, params.items.length - MAX_RECAP_ITEMS),
    fulfillmentMethod: params.fulfillmentMethod,
    pickupLocation: params.pickupLocation,
    tableNumber: params.tableNumber,
    phone: params.phone,
  };
}
