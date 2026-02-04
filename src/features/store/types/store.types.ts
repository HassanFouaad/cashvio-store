/**
 * Store-related types matching backend DTOs
 */

export enum StoreFrontStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface StoreFrontSeoDto {
  id: string;
  storeFrontId: string;
  tenantId: string;
  title: string | null;
  description: string | null;
  favIcon: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreFrontHeroImageDto {
  id: string;
  storeFrontId: string;
  tenantId: string;
  imageUrl: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreFrontSocialMediaDto {
  id: string;
  storeFrontId: string;
  tenantId: string;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  website: string | null;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreFrontDto {
  id: string;
  storeId: string;
  tenantId: string;
  logoUrl: string | null;
  hideOutOfStock: boolean;
  status: StoreFrontStatus;
  socialMedia?: StoreFrontSocialMediaDto | null;
  seo?: StoreFrontSeoDto | null;
  heroImages?: StoreFrontHeroImageDto[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Country DTO - matches backend CountryDto
 */
export interface CountryDto {
  id: number;
  nameEn: string;
  nameAr: string | null;
  nameFr: string | null;
  code: string;
  name?: string
}

export interface PublicStoreDto {
  id: string;
  tenantId: string;
  subdomain: string;
  name: string;
  currency: string;
  countryId?: number | null;
  country?: CountryDto | null;
  storeFront?: StoreFrontDto | null;
}

/**
 * Store error types
 */
export enum StoreErrorType {
  NOT_FOUND = 'STORE_NOT_FOUND',
  INACTIVE = 'STORE_INACTIVE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

export interface StoreError {
  type: StoreErrorType;
  message: string;
  subdomain?: string;
}
