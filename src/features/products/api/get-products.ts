"use server";

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { ApiException } from "@/lib/api/types";
import { cache } from "react";
import {
  PaginatedProductsResponse,
  ProductFilters,
  PublicProductDto,
} from "@/features/products/types/product.types";

/**
 * Fetch paginated products for a store
 * Uses React cache() to deduplicate requests within the same request lifecycle
 */
export const getProducts = cache(
  async (filters: ProductFilters): Promise<PaginatedProductsResponse> => {
    try {
      // Build query string
      const searchParams = new URLSearchParams({
        storeId: filters.storeId,
        tenantId: filters.tenantId,
        page: (filters.page || 1).toString(),
        limit: (filters.limit || 12).toString(),
        ...(filters.name && { name: filters.name }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
      });

      const response = await apiClient.getPaginated<PublicProductDto>(
        `${endpoints.products.getPublic()}?${searchParams.toString()}`
      );

      return response;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(500, "Failed to fetch products");
    }
  }
);

/**
 * Fetch single product by ID
 */
export const getProductById = cache(
  async (productId: string, storeId: string): Promise<PublicProductDto> => {
    try {
      const searchParams = new URLSearchParams({
        storeId,
      });

      const product = await apiClient.get<PublicProductDto>(
        `${endpoints.products.getPublicById(
          productId
        )}?${searchParams.toString()}`
      );

      return product;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(500, "Failed to fetch product details");
    }
  }
);

/**
 * Get products with error handling for UI
 * Returns null and error object instead of throwing
 */
export const getProductsWithErrorHandling = cache(
  async (
    filters: ProductFilters
  ): Promise<{
    products: PaginatedProductsResponse | null;
    error: string | null;
  }> => {
    try {
      const products = await getProducts(filters);
      return { products, error: null };
    } catch (error) {
      if (error instanceof ApiException) {
        return { products: null, error: error.message };
      }
      return { products: null, error: "An unexpected error occurred" };
    }
  }
);

/**
 * Get single product with error handling for UI
 */
export const getProductByIdWithErrorHandling = cache(
  async (
    productId: string,
    storeId: string
  ): Promise<{
    product: PublicProductDto | null;
    error: string | null;
  }> => {
    try {
      const product = await getProductById(productId, storeId);
      return { product, error: null };
    } catch (error) {
      if (error instanceof ApiException) {
        return { product: null, error: error.message };
      }
      return { product: null, error: "An unexpected error occurred" };
    }
  }
);
