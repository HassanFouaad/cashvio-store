import { apiConfig as envApiConfig } from '@/config/env.config';

/**
 * API configuration
 * Now using centralized environment configuration
 */
export const apiConfig = {
  baseUrl: envApiConfig.baseUrl,
  timeout: envApiConfig.timeout,
  enableLogging: envApiConfig.enableLogging,
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

export const endpoints = {
  stores: {
    getBySubdomain: (subdomain: string) => `/public/stores/${subdomain}`,
    getFulfillmentMethods: (storeId: string) => `/public/stores/${storeId}/fulfillment-methods`,
    getDeliveryZones: (storeId: string) => `/public/stores/${storeId}/delivery-zones`,
    staticPages: {
      list: '/public/stores/static-pages',
      getBySlug: (slug: string) => `/public/stores/static-pages/${slug}`,
    },
  },
  categories: {
    list: '/public/categories',
    getById: (id: string) => `/public/categories/${id}`,
  },
  products: {
    getPublic: () => '/public/products',
    getPublicById: (id: string) => `/public/products/${id}`,
  },
  orders: {
    preview: '/public/orders/preview',
    create: '/public/orders',
  },
  visitors: {
    track: '/public/visitors/track',
  },
  common: {
    countries: '/public/common/countries',
    citiesByCountry: (countryId: number) => `/public/common/countries/${countryId}/cities`,
  },
  carts: {
    get: (visitorId: string) => `/public/carts/${visitorId}`,
    modifyItem: '/public/carts/items',
  },
} as const;
