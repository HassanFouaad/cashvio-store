import {
  PublicProductDto,
  PublicProductImageDto,
  PublicProductVariantDto,
} from "@/features/products/types/product.types";
import { formatCurrency } from "@/lib/utils/formatters";

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
 * Get the most expensive variant from a list of variants
 */
export function getMostExpensiveVariant(
  variants: PublicProductVariantDto[] | undefined
): PublicProductVariantDto | null {
  if (!variants || variants.length === 0) return null;

  return variants.reduce((max, variant) =>
    variant.sellingPrice > max.sellingPrice ? variant : max
  );
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

/**
 * Get the total available quantity across all variants
 * Returns null for non-trackable inventory products (unlimited/not tracked)
 */
export function getTotalAvailableQuantity(
  variants: PublicProductVariantDto[] | undefined,
  inventoryTrackable: boolean = true
): number | null {
  if (!variants || variants.length === 0) return 0;
  // Non-trackable inventory products: return null to indicate unlimited
  if (!inventoryTrackable) return null;

  return variants.reduce(
    (total, variant) => total + variant.availableQuantity,
    0
  );
}

/**
 * Format product price or price range
 * Returns formatted string for display
 */
export function formatProductPrice(
  product: PublicProductDto,
  currency: string,
  locale: string
): string | null {
  const variants = product.variants || [];

  if (variants.length === 0) return null;

  // Single variant - return single price
  if (variants.length === 1) {
    return formatCurrency(variants[0].sellingPrice, currency, locale);
  }

  // Multiple variants - check if all have same price
  const prices = variants.map((v) => v.sellingPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // All variants have same price
  if (minPrice === maxPrice) {
    return formatCurrency(minPrice, currency, locale);
  }

  // Show price range
  return `${formatCurrency(minPrice, currency, locale)} - ${formatCurrency(
    maxPrice,
    currency,
    locale
  )}`;
}

/**
 * Get price range values (min and max)
 */
export function getPriceRange(
  variants: PublicProductVariantDto[] | undefined
): { min: number; max: number } | null {
  if (!variants || variants.length === 0) return null;

  const prices = variants.map((v) => v.sellingPrice);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Check if product has multiple price points
 */
export function hasVariedPricing(product: PublicProductDto): boolean {
  const variants = product.variants || [];
  if (variants.length <= 1) return false;

  const prices = variants.map((v) => v.sellingPrice);
  return new Set(prices).size > 1;
}

/**
 * Get in-stock variants only
 * If product is not tracking inventory, all variants are considered in stock
 */
export function getInStockVariants(
  variants: PublicProductVariantDto[] | undefined,
  inventoryTrackable: boolean = true
): PublicProductVariantDto[] {
  if (!variants) return [];
  // Non-trackable inventory products: all variants are in stock
  if (!inventoryTrackable) return variants;
  return variants.filter((v) => v.inStock);
}

/**
 * Get out-of-stock variants only
 * If product is not tracking inventory, no variants are considered out of stock
 */
export function getOutOfStockVariants(
  variants: PublicProductVariantDto[] | undefined,
  inventoryTrackable: boolean = true
): PublicProductVariantDto[] {
  if (!variants) return [];
  // Non-trackable inventory products: no variants are out of stock
  if (!inventoryTrackable) return [];
  return variants.filter((v) => !v.inStock);
}

/**
 * Find variant by ID
 */
export function findVariantById(
  variants: PublicProductVariantDto[] | undefined,
  variantId: string
): PublicProductVariantDto | undefined {
  if (!variants) return undefined;
  return variants.find((v) => v.id === variantId);
}
