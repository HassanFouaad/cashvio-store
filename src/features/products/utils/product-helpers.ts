import {
  PublicProductDto,
  PublicProductImageDto,
  PublicProductVariantDto,
} from "@/features/products/types/product.types";

interface PriceRange {
  minPrice: number;
  maxPrice: number;
}

/**
 * Product card translations interface
 * Used by ProductCard to display localized strings
 */
export interface ProductCardTranslations {
  noImageAvailable: string;
  outOfStock: string;
}

/**
 * Get the primary image or first available image from a product
 */
export function getPrimaryImage(
  product: PublicProductDto
): PublicProductImageDto | undefined {
  return product.images?.find((img) => img.isPrimary) || product.images?.[0];
}

/**
 * Sort product images with primary first, then by sortOrder
 */
export function sortProductImages(
  images: PublicProductImageDto[] | undefined
): PublicProductImageDto[] {
  if (!images || images.length === 0) return [];

  return [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.sortOrder - b.sortOrder;
  });
}

/**
 * Get the cheapest variant from a list of variants
 */
export function getCheapestVariant(
  variants: PublicProductVariantDto[] | undefined
): PublicProductVariantDto | null {
  if (!variants || variants.length === 0) return null;

  return variants.reduce((min, variant) =>
    variant.sellingPrice < min.sellingPrice ? variant : min
  );
}

/**
 * Check whether the merchant publishes this product to the online store.
 * Treats a missing flag as published so older API responses keep working.
 */
export function isAvailableOnStoreFront(product: PublicProductDto): boolean {
  return product.availableOnStoreFront !== false;
}

/**
 * Check if a product has any variants in stock
 * Non-trackable inventory products are always considered in stock
 */
export function isProductInStock(
  product: PublicProductDto | PublicProductVariantDto[]
): boolean {
  // If product has inventoryTrackable=false, always in stock
  if (!Array.isArray(product) && product.inventoryTrackable === false) {
    return true;
  }
  const variants = Array.isArray(product) ? product : product.variants || [];
  return variants.some((v) => v.inStock);
}

export function getPriceRange(prices: number[]): PriceRange | null {
  if (prices.length === 0) return null;
  return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
}

