import { ComponentType } from "react";
import {
  StoreFrontHeroImageDto,
  StoreFrontThemeHeroVariant,
} from "../types/store.types";
import { HeroCarousel } from "./hero/hero-carousel";
import { HeroFullBleed } from "./hero/hero-full-bleed";
import { HeroSplit } from "./hero/hero-split";

interface StoreHeroProps {
  heroImages: StoreFrontHeroImageDto[];
  storeName: string;
  variant?: StoreFrontThemeHeroVariant;
}

interface HeroVariantProps {
  heroImages: StoreFrontHeroImageDto[];
  storeName: string;
}

/**
 * Hero variant registry — adding a new hero style is one component plus
 * one entry here (plus the enum member in the backend catalog).
 */
const HERO_VARIANTS: Record<
  StoreFrontThemeHeroVariant,
  ComponentType<HeroVariantProps>
> = {
  [StoreFrontThemeHeroVariant.CAROUSEL]: HeroCarousel,
  [StoreFrontThemeHeroVariant.SPLIT]: HeroSplit,
  [StoreFrontThemeHeroVariant.FULL_BLEED]: HeroFullBleed,
};

/**
 * Theme-aware hero dispatcher. Defaults to CAROUSEL (the pre-theme-engine
 * hero) so stores without a theme render exactly as before.
 */
export function StoreHero({
  heroImages,
  storeName,
  variant = StoreFrontThemeHeroVariant.CAROUSEL,
}: StoreHeroProps) {
  const HeroVariant = HERO_VARIANTS[variant] ?? HeroCarousel;
  return <HeroVariant heroImages={heroImages} storeName={storeName} />;
}
