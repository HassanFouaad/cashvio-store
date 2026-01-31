import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { ApiException } from '@/lib/api/types';
import {
  CreateOrderPreviewRequest,
  OrderPreviewResponse,
  PublicFulfillmentMethodDto,
} from '../types/checkout.types';

/**
 * Get available fulfillment methods for a store
 * @param storeId The store ID
 * @returns Array of available fulfillment methods
 */
export async function getFulfillmentMethods(
  storeId: string
): Promise<PublicFulfillmentMethodDto[]> {
  try {
    const methods = await apiClient.get<PublicFulfillmentMethodDto[]>(
      endpoints.stores.getFulfillmentMethods(storeId)
    );
    return methods;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, 'Failed to fetch fulfillment methods');
  }
}

/**
 * Preview an order to get calculated totals
 * @param request The order preview request
 * @returns Order preview with calculated totals
 */
export async function previewOrder(
  request: CreateOrderPreviewRequest
): Promise<OrderPreviewResponse> {
  try {
    const preview = await apiClient.post<OrderPreviewResponse, CreateOrderPreviewRequest>(
      endpoints.orders.preview,
      request
    );
    return preview;
  } catch (error) {
    console.error('Failed to preview order', error);
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, 'Failed to preview order');
  }
}
