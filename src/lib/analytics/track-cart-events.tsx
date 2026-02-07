"use client";

import { useCartStore } from "@/features/cart/store";
import { useEffect, useRef } from "react";
import { analytics } from "./tracker";

/**
 * Client component that tracks view_cart event using cart store data.
 * Place on the cart page.
 *
 * Wrapped in try-catch to ensure analytics errors never affect the store.
 */
export function TrackViewCartEvent({ currency }: { currency: string }) {
  const tracked = useRef(false);
  const cart = useCartStore((state) => state.cart);
  const isInitialized = useCartStore((state) => state.isInitialized);

  useEffect(() => {
    if (tracked.current || !isInitialized || !cart) return;
    tracked.current = true;

    try {
      analytics.trackViewCart({
        currency,
        value: cart.subtotal,
        items: cart.items.map((item) => ({
          item_id: item.variant.id,
          item_name: item.productName || "",
          price: item.variant.sellingPrice,
          quantity: item.quantity,
          item_variant: item.variant.name,
        })),
      });
    } catch {
      // Analytics errors must never affect the store
    }
  }, [isInitialized, cart, currency]);

  return null;
}

/**
 * Client component that tracks begin_checkout event using cart store data.
 * Place on the checkout page.
 *
 * Wrapped in try-catch to ensure analytics errors never affect the store.
 */
export function TrackBeginCheckoutEvent({ currency }: { currency: string }) {
  const tracked = useRef(false);
  const cart = useCartStore((state) => state.cart);
  const isInitialized = useCartStore((state) => state.isInitialized);

  useEffect(() => {
    if (tracked.current || !isInitialized || !cart) return;
    tracked.current = true;

    try {
      analytics.trackBeginCheckout({
        currency,
        value: cart.subtotal,
        items: cart.items.map((item) => ({
          item_id: item.variant.id,
          item_name: item.productName || "",
          price: item.variant.sellingPrice,
          quantity: item.quantity,
          item_variant: item.variant.name,
        })),
      });
    } catch {
      // Analytics errors must never affect the store
    }
  }, [isInitialized, cart, currency]);

  return null;
}
