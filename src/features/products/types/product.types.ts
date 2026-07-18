/**
 * Product-related types matching backend DTOs
 */

import { PaginationMeta } from "@/lib/api/types";

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ProductSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  PRICE_LOW_TO_HIGH = 'priceLowToHigh',
  PRICE_HIGH_TO_LOW = 'priceHighToLow',
}

export interface PublicProductVariantDto {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  availableQuantity: number;
  inStock: boolean;
  inventoryTrackable: boolean;
  maxQuantityPerOrder?: number | null;
}

export interface PublicProductImageDto {
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface PublicProductDto {
  id: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  status: ProductStatus;
  taxRate?: number | null;
  taxIncluded: boolean;
  inventoryTrackable: boolean;
  images?: PublicProductImageDto[];
  variants?: PublicProductVariantDto[];
  /** Average rating from displayed reviews (1 decimal), null when none */
  averageRating?: number | null;
  /** Number of displayed reviews */
  reviewCount?: number;
}

export interface PaginatedProductsResponse {
  items: PublicProductDto[];
  pagination: PaginationMeta;
}

export interface ProductFilters {
  storeId: string;
  tenantId: string;
  name?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  sortBy?: ProductSortBy;
  inStock?: boolean;
}

/**
 * Product review types (public-facing, no storeVisitorId exposed)
 */
export interface ProductReviewDto {
  id: string;
  productId: string;
  storeId: string;
  name: string;
  stars: number;
  comment: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductReviewFormData {
  name: string;
  stars: number;
  comment: string;
}

export interface PaginatedReviewsResponse {
  items: ProductReviewDto[];
  pagination: PaginationMeta;
}
