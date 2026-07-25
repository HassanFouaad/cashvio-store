import {
  StoreFrontThemeDensity,
  StoreFrontThemeHeaderVariant,
  StoreFrontThemeLayout,
  StoreFrontThemePageBand,
  StoreFrontThemeTypography,
} from "@/features/store/types/store.types";

/**
 * Class sets derived from the theme's personality axes (density,
 * typography, pageBand) plus the header variant for alignment. One
 * resolver so every section, grid, and page band follows the same
 * design language — REGULAR/REGULAR/MUTED reproduces the pre-axis look
 * byte-for-byte for default stores.
 */
export interface ThemePersonality {
  /** Vertical rhythm of homepage/listing sections */
  section: string;
  /** Wrapper around a section title + "view all" link */
  headingWrapper: string;
  /** The section h2 itself */
  heading: string;
  /** Product grid on homepage sections */
  homeGrid: string;
  /** Product grid on listing/category pages */
  listingGrid: string;
  /** Page-title band (listing, cart, checkout, track) */
  band: string;
  /** The page h1 inside the band */
  bandTitle: string;
  /** The subtitle line inside the band */
  bandSubtitle: string;
  /** Display title inside SPLIT / FULL_BLEED heroes */
  heroTitle: string;
}

const SECTION_BY_DENSITY: Record<StoreFrontThemeDensity, string> = {
  [StoreFrontThemeDensity.REGULAR]: "py-6 sm:py-8 md:py-12",
  [StoreFrontThemeDensity.AIRY]: "py-10 sm:py-14 md:py-20",
  [StoreFrontThemeDensity.COMPACT]: "py-4 sm:py-6 md:py-8",
};

const HEADING_MARGIN_BY_DENSITY: Record<StoreFrontThemeDensity, string> = {
  [StoreFrontThemeDensity.REGULAR]: "mb-4 sm:mb-6",
  [StoreFrontThemeDensity.AIRY]: "mb-6 sm:mb-10",
  [StoreFrontThemeDensity.COMPACT]: "mb-3 sm:mb-4",
};

const HOME_GRID_BY_DENSITY: Record<StoreFrontThemeDensity, string> = {
  [StoreFrontThemeDensity.REGULAR]:
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4 md:gap-6",
  [StoreFrontThemeDensity.AIRY]:
    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-10",
  [StoreFrontThemeDensity.COMPACT]:
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3",
};

const LISTING_GRID_BY_DENSITY: Record<StoreFrontThemeDensity, string> = {
  [StoreFrontThemeDensity.REGULAR]:
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4 md:gap-6",
  [StoreFrontThemeDensity.AIRY]:
    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-10",
  [StoreFrontThemeDensity.COMPACT]:
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3",
};

const HEADING_BY_TYPOGRAPHY: Record<StoreFrontThemeTypography, string> = {
  [StoreFrontThemeTypography.REGULAR]:
    "text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight",
  [StoreFrontThemeTypography.DISPLAY]:
    "text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight",
  [StoreFrontThemeTypography.EDITORIAL]:
    "text-sm sm:text-base font-semibold uppercase tracking-[0.16em]",
};

const HERO_TITLE_BY_TYPOGRAPHY: Record<StoreFrontThemeTypography, string> = {
  [StoreFrontThemeTypography.REGULAR]:
    "text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight",
  [StoreFrontThemeTypography.DISPLAY]:
    "text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight",
  [StoreFrontThemeTypography.EDITORIAL]:
    "text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight",
};

const BAND_BY_VARIANT: Record<StoreFrontThemePageBand, string> = {
  [StoreFrontThemePageBand.MUTED]: "bg-muted/30 py-6 sm:py-8 md:py-12",
  [StoreFrontThemePageBand.PLAIN]: "pt-10 sm:pt-14 md:pt-16 pb-2 sm:pb-4",
  [StoreFrontThemePageBand.RULED]:
    "border-y border-border py-6 sm:py-8 md:py-10",
};

export function getThemePersonality(
  layout: StoreFrontThemeLayout,
): ThemePersonality {
  const isCentered = layout.header === StoreFrontThemeHeaderVariant.CENTERED;

  const headingWrapper = isCentered
    ? `flex flex-col items-center gap-2 text-center ${
        layout.density === StoreFrontThemeDensity.REGULAR
          ? "mb-5 sm:mb-8"
          : HEADING_MARGIN_BY_DENSITY[layout.density]
      }`
    : `flex items-center justify-between ${HEADING_MARGIN_BY_DENSITY[layout.density]}`;

  return {
    section: SECTION_BY_DENSITY[layout.density],
    headingWrapper,
    heading: HEADING_BY_TYPOGRAPHY[layout.typography],
    homeGrid: HOME_GRID_BY_DENSITY[layout.density],
    listingGrid: LISTING_GRID_BY_DENSITY[layout.density],
    band: BAND_BY_VARIANT[layout.pageBand],
    bandTitle: buildBandTitle(layout),
    bandSubtitle: "text-sm sm:text-base text-muted-foreground",
    heroTitle: HERO_TITLE_BY_TYPOGRAPHY[layout.typography],
  };
}

/**
 * Page h1 treatment: size follows the band (PLAIN gets an oversized
 * title carrying the missing band weight), weight/case follow the
 * typography personality.
 */
function buildBandTitle(layout: StoreFrontThemeLayout): string {
  if (layout.typography === StoreFrontThemeTypography.EDITORIAL) {
    return "text-xl sm:text-2xl font-semibold uppercase tracking-[0.16em]";
  }

  const size =
    layout.pageBand === StoreFrontThemePageBand.PLAIN
      ? "text-3xl sm:text-4xl md:text-5xl"
      : "text-2xl sm:text-3xl md:text-4xl";
  const weight =
    layout.typography === StoreFrontThemeTypography.DISPLAY
      ? "font-bold"
      : "font-semibold";

  return `${size} ${weight} tracking-tight`;
}
