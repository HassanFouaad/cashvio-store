"use server";

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { ApiException } from "@/lib/api/types";
import { cache } from "react";
import {
  PaginatedReviewsResponse,
  ProductReviewDto,
} from "@/features/products/types/product.types";

/**
 * Fetch displayed reviews for a product (public endpoint)
 * Uses React cache() to deduplicate requests within the same request lifecycle
 */
export const getProductReviews = cache(
  async (
    productId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedReviewsResponse> => {
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await apiClient.getPaginated<ProductReviewDto>(
        `${endpoints.products.reviews(productId)}?${searchParams.toString()}`
      );

      return response;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(500, "Failed to fetch product reviews");
    }
  }
);

/**
 * Get product reviews with error handling for UI
 * Returns null and error object instead of throwing
 */
export const getProductReviewsWithErrorHandling = cache(
  async (
    productId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    reviews: PaginatedReviewsResponse | null;
    error: string | null;
  }> => {
    try {
      const reviews = await getProductReviews(productId, page, limit);
      return { reviews, error: null };
    } catch (error) {
      if (error instanceof ApiException) {
        return { reviews: null, error: error.message };
      }
      return { reviews: null, error: "An unexpected error occurred" };
    }
  }
);
