/**
 * Store-related types matching backend DTOs
 */

export enum StoreFrontStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Merchant-selectable font pairing (en + ar capable).
 * DEFAULT inherits the pairing defined by the assigned theme.
 */
export enum StoreFrontFontPreset {
  DEFAULT = 'DEFAULT',
  CLASSIC = 'CLASSIC',
  MODERN = 'MODERN',
  TECHNICAL = 'TECHNICAL',
  ELEGANT = 'ELEGANT',
  FRIENDLY = 'FRIENDLY',
  CLEAN = 'CLEAN',
}

/**
 * Corner radius scale. DEFAULT inherits the radius defined by the theme.
 */
export enum StoreFrontRadiusPreset {
  DEFAULT = 'DEFAULT',
  SHARP = 'SHARP',
  SOFT = 'SOFT',
  ROUNDED = 'ROUNDED',
  PILL = 'PILL',
}

/** Structural layout of the storefront header */
export enum StoreFrontThemeHeaderVariant {
  CLASSIC = 'CLASSIC',
  CENTERED = 'CENTERED',
  MINIMAL = 'MINIMAL',
}

/** Structural layout of the homepage hero */
export enum StoreFrontThemeHeroVariant {
  CAROUSEL = 'CAROUSEL',
  SPLIT = 'SPLIT',
  FULL_BLEED = 'FULL_BLEED',
}

/** Structural layout of product cards */
export enum StoreFrontThemeProductCardVariant {
  STANDARD = 'STANDARD',
  OVERLAY = 'OVERLAY',
  MINIMAL = 'MINIMAL',
}

/** Structural layout of the storefront footer */
export enum StoreFrontThemeFooterVariant {
  CLASSIC = 'CLASSIC',
  CENTERED = 'CENTERED',
  MINIMAL = 'MINIMAL',
}

/** Visual style of primary action buttons */
export enum StoreFrontThemeButtonVariant {
  SOLID = 'SOLID',
  OUTLINE = 'OUTLINE',
}

/** Stroke personality of storefront icons */
export enum StoreFrontThemeIconStyle {
  OUTLINE = 'OUTLINE',
  LIGHT = 'LIGHT',
  BOLD = 'BOLD',
}

/** Structural layout of the product detail page */
export enum StoreFrontThemeProductPageVariant {
  CLASSIC = 'CLASSIC',
  GALLERY = 'GALLERY',
  STACKED = 'STACKED',
}

/** Chrome of the checkout / order tracking / order success pages */
export enum StoreFrontThemeOrderPagesVariant {
  CARD = 'CARD',
  FLAT = 'FLAT',
}

/** Structural style of the mobile bottom navigation */
export enum StoreFrontThemeMobileNavVariant {
  LABELED = 'LABELED',
  ICON_PILL = 'ICON_PILL',
}

/**
 * A single mode's design-token map (6-digit hex values).
 * Mirrors the CSS custom properties in globals.css one-to-one.
 */
export interface StoreFrontThemeTokenSet {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

/** Full theme token payload: explicit palettes for light and dark mode */
export interface StoreFrontThemeTokens {
  light: StoreFrontThemeTokenSet;
  dark: StoreFrontThemeTokenSet;
}

/** Layout-variant map of a theme (structurally different pages) */
export interface StoreFrontThemeLayout {
  header: StoreFrontThemeHeaderVariant;
  hero: StoreFrontThemeHeroVariant;
  productCard: StoreFrontThemeProductCardVariant;
  productPage: StoreFrontThemeProductPageVariant;
  orderPages: StoreFrontThemeOrderPagesVariant;
  footer: StoreFrontThemeFooterVariant;
  mobileNav: StoreFrontThemeMobileNavVariant;
  buttonStyle: StoreFrontThemeButtonVariant;
  iconStyle: StoreFrontThemeIconStyle;
}

/** Color palette catalog entry — matches backend StoreFrontPaletteDto */
export interface StoreFrontPaletteDto {
  id: string;
  key: string;
  nameEn: string;
  nameAr: string;
  tokens: StoreFrontThemeTokens;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Theme catalog entry (structural design) — matches backend StoreFrontThemeDto */
export interface StoreFrontThemeDto {
  id: string;
  key: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  defaultPaletteId: string;
  defaultPalette?: StoreFrontPaletteDto | null;
  layout: StoreFrontThemeLayout;
  fontPreset: StoreFrontFontPreset;
  radiusPreset: StoreFrontRadiusPreset;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  linkUrl: string | null;
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
  contactEmail: string | null;
  /** Dedicated WhatsApp number — server falls back to contactPhone when unset */
  whatsappNumber: string | null;
  /** Merchant toggle for WhatsApp chat button/links on the storefront */
  showWhatsappButton: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreFrontWebEventsDto {
  id: string;
  storeFrontId: string;
  tenantId: string;
  gtmId: string | null;
  facebookPixelId: string | null;
  tiktokPixelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreFrontDto {
  id: string;
  storeId: string;
  tenantId: string;
  logoUrl: string | null;
  themeId: string | null;
  paletteId: string | null;
  /** Merchant custom palette — mutually exclusive with paletteId */
  customTokens?: StoreFrontThemeTokens | null;
  fontPreset: StoreFrontFontPreset | null;
  radiusPreset: StoreFrontRadiusPreset | null;
  theme?: StoreFrontThemeDto | null;
  palette?: StoreFrontPaletteDto | null;
  hideOutOfStock: boolean;
  status: StoreFrontStatus;
  announcementTextEn?: string | null;
  announcementTextAr?: string | null;
  footerTextEn?: string | null;
  footerTextAr?: string | null;
  socialMedia?: StoreFrontSocialMediaDto | null;
  seo?: StoreFrontSeoDto | null;
  heroImages?: StoreFrontHeroImageDto[];
  webEvents?: StoreFrontWebEventsDto | null;
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
  name?: string;
}

/**
 * City DTO - matches backend CityDto
 */
export interface CityDto {
  id: number;
  nameEn: string;
  nameAr: string | null;
  nameFr: string | null;
  code: string;
  countryId: number;
  name?: string;
}

export interface PublicStoreDto {
  id: string;
  tenantId: string;
  subdomain: string;
  name: string;
  currency: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  countryId?: number | null;
  country?: CountryDto | null;
  cityId?: number | null;
  city?: CityDto | null;
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

/**
 * Static page DTO for public display
 * Localized content is returned based on Accept-Language header
 */
export interface PublicStaticPageDto {
  id: string;
  slug: string;
  title: string;
  content: string;
  displayOrder: number;
}

/**
 * Static page with metadata for list views
 */
export interface StaticPageListItem {
  id: string;
  slug: string;
  title: string;
  displayOrder: number;
}
