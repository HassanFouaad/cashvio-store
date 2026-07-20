import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { unstable_cache } from "next/cache";
import {
  CartOrderSettings,
  StoreOrderPaymentSettingsDto,
} from "../types/cart.types";

/**
 * Minimum-order settings change rarely — a short shared cache removes one
 * backend round-trip from every cart render while portal changes still
 * appear within a minute (same policy as the store-config cache).
 */
const SETTINGS_CACHE_REVALIDATE_SECONDS = 60;

const fetchOrderPaymentSettingsCached = unstable_cache(
  async (storeId: string): Promise<StoreOrderPaymentSettingsDto | null> => {
    return apiClient.get<StoreOrderPaymentSettingsDto | null>(
      endpoints.stores.getOrderPaymentSettings(storeId),
      { headers: { "X-Store-Id": storeId } },
    );
  },
  ["store-order-payment-settings"],
  { revalidate: SETTINGS_CACHE_REVALIDATE_SECONDS },
);

/**
 * Fetch the order settings the cart UI nudges need (server-side).
 * Zeros disable the corresponding nudge (also on fetch failure); checkout
 * preview stays the enforcement point.
 */
export async function getCartOrderSettings(
  storeId: string,
): Promise<CartOrderSettings> {
  try {
    const settings = await fetchOrderPaymentSettingsCached(storeId);
    return {
      minimumOrderValue: settings?.minimumOrderValue ?? 0,
      freeDeliveryThreshold: settings?.freeDeliveryThreshold ?? 0,
    };
  } catch {
    return { minimumOrderValue: 0, freeDeliveryThreshold: 0 };
  }
}
