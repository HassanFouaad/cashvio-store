import { ComponentType } from "react";
import {
  PublicStoreDto,
  StoreFrontThemeHeaderVariant,
} from "../types/store.types";
import { HeaderCentered } from "./header/header-centered";
import { HeaderClassic } from "./header/header-classic";
import { HeaderMinimal } from "./header/header-minimal";

interface StoreHeaderProps {
  store: PublicStoreDto;
  variant?: StoreFrontThemeHeaderVariant;
}

interface HeaderVariantProps {
  store: PublicStoreDto;
}

/**
 * Header variant registry — adding a new header style is one component
 * plus one entry here (plus the enum member in the backend catalog).
 */
const HEADER_VARIANTS: Record<
  StoreFrontThemeHeaderVariant,
  ComponentType<HeaderVariantProps>
> = {
  [StoreFrontThemeHeaderVariant.CLASSIC]: HeaderClassic,
  [StoreFrontThemeHeaderVariant.CENTERED]: HeaderCentered,
  [StoreFrontThemeHeaderVariant.MINIMAL]: HeaderMinimal,
};

/**
 * Theme-aware header dispatcher. Defaults to CLASSIC (the pre-theme-engine
 * header) so stores without a theme render exactly as before.
 */
export function StoreHeader({
  store,
  variant = StoreFrontThemeHeaderVariant.CLASSIC,
}: StoreHeaderProps) {
  const HeaderVariant = HEADER_VARIANTS[variant] ?? HeaderClassic;
  return <HeaderVariant store={store} />;
}
