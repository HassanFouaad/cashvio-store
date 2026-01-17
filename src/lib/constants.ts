import { appConfig, apiConfig, cacheConfig } from '@/config/env.config';

/**
 * Application-wide constants
 * Now using centralized environment configuration
 */

export const APP_NAME = appConfig.name;

export const API_CONFIG = {
  BASE_URL: apiConfig.baseUrl,
  TIMEOUT: apiConfig.timeout,
} as const;

export const CACHE_KEYS = {
  STORE: 'store',
  PRODUCTS: 'products',
  PRODUCT: 'product',
  CATEGORIES: 'categories',
} as const;

export const ROUTES = {
  HOME: '/',
  STORE: (code: string) => `/store/${code}`,
  PRODUCTS: (code: string) => `/store/${code}/products`,
  PRODUCT: (code: string, slug: string) => `/store/${code}/products/${slug}`,
  CART: (code: string) => `/store/${code}/cart`,
  CHECKOUT: (code: string) => `/store/${code}/checkout`,
} as const;

export const STORE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export const QUERY_STALE_TIME = {
  DEFAULT: cacheConfig.defaultStaleTime,
  STORE: cacheConfig.storeStaleTime,
  PRODUCTS: cacheConfig.productsStaleTime,
} as const;
