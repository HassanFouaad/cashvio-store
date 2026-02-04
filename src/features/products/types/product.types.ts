/**
 * Product-related types matching backend DTOs
 */

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
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
  tags?: string[];
  taxRate?: number | null;
  taxIncluded: boolean;
  inventoryTrackable: boolean;
  images?: PublicProductImageDto[];
  variants?: PublicProductVariantDto[];
}

export interface PaginatedProductsResponse {
  items: PublicProductDto[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
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
