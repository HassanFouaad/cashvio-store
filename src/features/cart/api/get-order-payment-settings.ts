import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { unstable_cache } from "next/cache";
import { StoreOrderPaymentSettingsDto } from "../types/cart.types";

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
 * Fetch the store's minimum order value (server-side).
 * Returns 0 when no settings exist or the request fails — the cart nudge
 * simply doesn't render, and checkout preview stays the enforcement point.
 */
export async function getMinimumOrderValue(storeId: string): Promise<number> {
  try {
    const settings = await fetchOrderPaymentSettingsCached(storeId);
    return settings?.minimumOrderValue ?? 0;
  } catch {
    return 0;
  }
}
