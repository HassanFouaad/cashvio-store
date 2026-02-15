import type {
  CreateProductReviewFormData,
  ProductReviewDto,
} from "@/features/products/types/product.types";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { ApiException } from "@/lib/api/types";

/**
 * Submit a product review (client-side)
 *
 * Follows the same pattern as checkout's createOrder:
 * called from a "use client" component where window.__STORE_ID__ is available,
 * so apiClient automatically includes the X-Store-Id header.
 *
 * storeVisitorId is not sent from the storefront — it stays null on the backend.
 *
 * @param productId - Product ID
 * @param formData - Review form data (name, stars, comment)
 * @returns Success/error result
 */
export async function submitProductReview(
  productId: string,
  formData: CreateProductReviewFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.post<ProductReviewDto>(
      endpoints.products.reviews(productId),
      {
        name: formData.name,
        stars: formData.stars,
        comment: formData.comment,
      }
    );

    return { success: true };
  } catch (error) {
    if (error instanceof ApiException) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to submit review" };
  }
}
