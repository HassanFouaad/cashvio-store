import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { ApiException } from '@/lib/api/types';
import {
  CreateOrderPreviewRequest,
  CreateOrderRequest,
  GroupedDeliveryZoneCityDto,
  GroupedDeliveryZoneCountryDto,
  GroupedDeliveryZonesDto,
  OrderCreatedResponse,
  OrderPreviewResponse,
  PublicDeliveryZonesResponseDto,
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
 * Group delivery zones by country for UI display
 * @param zones Flat array of delivery zones from API
 * @param locale Current locale for name selection
 * @returns Grouped delivery zones by country
 */
export function groupDeliveryZonesByCountry(
  zones: PublicDeliveryZonesResponseDto,
  locale: string
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
      const countryName = locale === 'ar' ? zone.country.nameAr : zone.country.nameEn;
      countriesMap.set(countryId, {
        country: {
          id: countryId,
          name: countryName,
          code: zone.country.code,
          cities: [],
        },
        cities: [],
      });
    }

    const cityName = locale === 'ar' ? zone.city.nameAr : zone.city.nameEn;
    const entry = countriesMap.get(countryId)!;

    // Check if city is already added
    if (!entry.cities.some((c) => c.id === zone.cityId)) {
      entry.cities.push({
        id: zone.cityId,
        name: cityName,
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
