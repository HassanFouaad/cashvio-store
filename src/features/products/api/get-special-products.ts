'use server';

import { PublicProductDto } from '@/features/products/types/product.types';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { ApiException } from '@/lib/api/types';
import { cache } from 'react';

export const getSpecialProducts = cache(
  async (): Promise<PublicProductDto[]> => {
    try {
      return await apiClient.get<PublicProductDto[]>(
        endpoints.stores.specialProducts,
      );
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(500, 'Failed to fetch special products');
    }
  },
);

export const getSpecialProductsWithErrorHandling = cache(
  async (): Promise<{
    products: PublicProductDto[] | null;
    error: string | null;
  }> => {
    try {
      const products = await getSpecialProducts();
      return { products, error: null };
    } catch (error) {
      if (error instanceof ApiException) {
        return { products: null, error: error.message };
      }
      return { products: null, error: 'An unexpected error occurred' };
    }
  },
);
