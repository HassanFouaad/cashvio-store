import { cacheConfig } from '@/config/env.config';


export const CACHE_KEYS = {
  STORE: 'store',
  PRODUCTS: 'products',
  PRODUCT: 'product',
  CATEGORIES: 'categories',
} as const;


export const QUERY_STALE_TIME = {
  DEFAULT: cacheConfig.defaultStaleTime,
  STORE: cacheConfig.storeStaleTime,
  PRODUCTS: cacheConfig.productsStaleTime,
} as const;
