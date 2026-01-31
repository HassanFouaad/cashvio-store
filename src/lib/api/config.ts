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
    getByCode: (code: string) => `/public/stores/${code}`,
    getFulfillmentMethods: (storeId: string) => `/public/stores/${storeId}/fulfillment-methods`,
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
  },
  visitors: {
    track: '/public/visitors/track',
  },
} as const;
