import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { ApiException } from '@/lib/api/types';
import {
    CommonCityDto,
    CommonCountryDto,
    CreateOrderPreviewRequest,
    CreateOrderRequest,
    GroupedDeliveryZoneCityDto,
    GroupedDeliveryZoneCountryDto,
    GroupedDeliveryZonesDto,
    OrderCreatedResponse,
    OrderPreviewResponse,
    PublicDeliveryZonesResponseDto,
    PublicFulfillmentMethodDto,
    PublicStorefrontPaymentMethodDto,
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

/**
 * Create an order (place order)
 * @param request The order creation request
 * @returns Order created response with order ID and number
 */
export async function createOrder(
  request: CreateOrderRequest
): Promise<OrderCreatedResponse> {
  try {
    const order = await apiClient.post<OrderCreatedResponse, CreateOrderRequest>(
      endpoints.orders.create,
      request
    );
    return order;
  } catch (error) {
    console.error('Failed to create order', error);
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, 'Failed to create order');
  }
}

/**
 * Get active storefront payment methods for a store
 * @param storeId The store ID
 * @returns Array of active storefront payment methods sorted by sortOrder
 */
export async function getStorefrontPaymentMethods(
  storeId: string
): Promise<PublicStorefrontPaymentMethodDto[]> {
  try {
    const methods = await apiClient.get<PublicStorefrontPaymentMethodDto[]>(
      endpoints.stores.getStorefrontPaymentMethods(storeId)
    );
    return methods;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, 'Failed to fetch storefront payment methods');
  }
}

/**
 * Response from receipt upload URL endpoint
 */
export interface ReceiptUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
}

/**
 * Get presigned URL for uploading a receipt image
 * @param storeId The store ID
 * @param fileName Original file name
 * @param fileMimeType MIME type (image/jpeg, image/png, image/webp)
 * @returns Presigned upload URL and file key for order creation
 */
export async function getReceiptUploadUrl(
  storeId: string,
  fileName: string,
  fileMimeType: string
): Promise<ReceiptUploadUrlResponse> {
  try {
    const response = await apiClient.post<
      ReceiptUploadUrlResponse,
      { fileName: string; fileMimeType: string }
    >(endpoints.stores.getReceiptUploadUrl(storeId), {
      fileName,
      fileMimeType,
    });
    return response;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, 'Failed to get receipt upload URL');
  }
}

/**
 * Upload receipt file to S3 presigned URL
 * @param uploadUrl Presigned URL from getReceiptUploadUrl
 * @param file The file to upload
 */
export async function uploadReceiptToPresignedUrl(
  uploadUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new ApiException(
      response.status,
      `Failed to upload receipt: ${response.statusText}`
    );
  }
}

/**
 * Get available delivery zones for a store
 * @param storeId The store ID
 * @returns Delivery zones as flat array (frontend handles grouping)
 */
export async function getDeliveryZones(
  storeId: string
): Promise<PublicDeliveryZonesResponseDto> {
  try {
    const zones = await apiClient.get<PublicDeliveryZonesResponseDto>(
      endpoints.stores.getDeliveryZones(storeId)
    );
    return zones;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, 'Failed to fetch delivery zones');
  }
}

/**
 * Get all countries from the common API (fallback when no delivery zones configured)
 * @returns Array of all countries
 */
export async function getCountries(): Promise<CommonCountryDto[]> {
  try {
    const countries = await apiClient.get<CommonCountryDto[]>(
      endpoints.common.countries
    );
    return countries;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, 'Failed to fetch countries');
  }
}

/**
 * Get cities for a country from the common API (fallback when no delivery zones configured)
 * @param countryId The country ID
 * @returns Array of cities for the specified country
 */
export async function getCitiesByCountry(
  countryId: number
): Promise<CommonCityDto[]> {
  try {
    const cities = await apiClient.get<CommonCityDto[]>(
      endpoints.common.citiesByCountry(countryId)
    );
    return cities;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(500, 'Failed to fetch cities');
  }
}

/**
 * Group delivery zones by country for UI display.
 * Uses the backend-provided localized `name` field (no frontend locale logic needed).
 * @param zones Flat array of delivery zones from API
 * @returns Grouped delivery zones by country
 */
export function groupDeliveryZonesByCountry(
  zones: PublicDeliveryZonesResponseDto,
): GroupedDeliveryZonesDto {
  const countriesMap = new Map<
    number,
    {
      country: GroupedDeliveryZoneCountryDto;
      cities: GroupedDeliveryZoneCityDto[];
    }
  >();

  for (const zone of zones.zones) {
    const countryId = zone.countryId;

    if (!countriesMap.has(countryId)) {
      countriesMap.set(countryId, {
        country: {
          id: countryId,
          name: zone.country.name,
          code: zone.country.code,
          cities: [],
        },
        cities: [],
      });
    }

    const entry = countriesMap.get(countryId)!;

    // Check if city is already added
    if (!entry.cities.some((c) => c.id === zone.cityId)) {
      entry.cities.push({
        id: zone.cityId,
        name: zone.city.name,
      });
    }
  }

  // Convert to array and add cities to countries
  const countries: GroupedDeliveryZoneCountryDto[] = [];
  for (const entry of countriesMap.values()) {
    entry.country.cities = entry.cities;
    countries.push(entry.country);
  }

  // Sort countries by name
  countries.sort((a, b) => a.name.localeCompare(b.name));

  // Sort cities within each country
  for (const country of countries) {
    country.cities.sort((a, b) => a.name.localeCompare(b.name));
  }

  return { countries };
}
