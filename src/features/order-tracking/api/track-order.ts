import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { ApiException } from "@/lib/api/types";
import {
  PublicOrderTrackingDto,
  TrackOrderRequest,
} from "../types/order-tracking.types";

/**
 * Look up an order's status by order number + the phone used at checkout.
 * Runs client-side — X-Store-Id is attached automatically by the API client.
 */
export async function trackOrder(
  request: TrackOrderRequest,
): Promise<PublicOrderTrackingDto> {
  const searchParams = new URLSearchParams({
    orderNumber: request.orderNumber,
    phone: request.phone,
  });

  try {
    return await apiClient.get<PublicOrderTrackingDto>(
      `${endpoints.orders.track}?${searchParams.toString()}`,
    );
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, "Failed to track order");
  }
}
