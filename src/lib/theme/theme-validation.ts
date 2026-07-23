import {
  StoreFrontThemeButtonVariant,
  StoreFrontThemeFooterVariant,
  StoreFrontThemeHeaderVariant,
  StoreFrontThemeHeroVariant,
  StoreFrontThemeIconStyle,
  StoreFrontThemeLayout,
  StoreFrontThemeMobileNavVariant,
  StoreFrontThemeOrderPagesVariant,
  StoreFrontThemeProductCardVariant,
  StoreFrontThemeProductPageVariant,
  StoreFrontThemeTokenSet,
} from "@/features/store/types/store.types";
import {
  THEME_HEX_COLOR_REGEX,
  THEME_TOKEN_KEYS,
  ThemeTokenKey,
} from "./theme-constants";

/**
 * Theme data comes from the database (and, for previews, from a URL-driven
 * catalog lookup), so the storefront re-validates every value before it can
 * reach a <style> tag. Invalid values are dropped per-key — the token then
 * falls back to the globals.css default instead of breaking the page.
 */

/** A validated, possibly partial token set — only hex-safe values survive. */
export type SafeThemeTokenSet = Partial<Record<ThemeTokenKey, string>>;

export function sanitizeTokenSet(
  tokens: StoreFrontThemeTokenSet | null | undefined,
): SafeThemeTokenSet {
  const safe: SafeThemeTokenSet = {};

  if (!tokens) {
    return safe;
  }

  for (const key of THEME_TOKEN_KEYS) {
    const value = tokens[key];
    if (typeof value === "string" && THEME_HEX_COLOR_REGEX.test(value)) {
      safe[key] = value.toLowerCase();
    }
  }

  return safe;
}

/**
 * Validate a layout map against the variant allowlists. Unknown values fall
 * back to the CLASSIC/default variant so a bad catalog row can never break
 * rendering.
 */
export function sanitizeThemeLayout(
  layout: StoreFrontThemeLayout | null | undefined,
): StoreFrontThemeLayout {
  const headerValues = Object.values(StoreFrontThemeHeaderVariant);
  const heroValues = Object.values(StoreFrontThemeHeroVariant);
  const productCardValues = Object.values(StoreFrontThemeProductCardVariant);
  const productPageValues = Object.values(StoreFrontThemeProductPageVariant);
  const orderPagesValues = Object.values(StoreFrontThemeOrderPagesVariant);
  const footerValues = Object.values(StoreFrontThemeFooterVariant);
  const mobileNavValues = Object.values(StoreFrontThemeMobileNavVariant);
  const buttonValues = Object.values(StoreFrontThemeButtonVariant);
  const iconStyleValues = Object.values(StoreFrontThemeIconStyle);

  return {
    header:
      layout && headerValues.includes(layout.header)
        ? layout.header
        : StoreFrontThemeHeaderVariant.CLASSIC,
    hero:
      layout && heroValues.includes(layout.hero)
        ? layout.hero
        : StoreFrontThemeHeroVariant.CAROUSEL,
    productCard:
      layout && productCardValues.includes(layout.productCard)
        ? layout.productCard
        : StoreFrontThemeProductCardVariant.STANDARD,
    productPage:
      layout && productPageValues.includes(layout.productPage)
        ? layout.productPage
        : StoreFrontThemeProductPageVariant.CLASSIC,
    orderPages:
      layout && orderPagesValues.includes(layout.orderPages)
        ? layout.orderPages
        : StoreFrontThemeOrderPagesVariant.CARD,
    footer:
      layout && footerValues.includes(layout.footer)
        ? layout.footer
        : StoreFrontThemeFooterVariant.CLASSIC,
    mobileNav:
      layout && mobileNavValues.includes(layout.mobileNav)
        ? layout.mobileNav
        : StoreFrontThemeMobileNavVariant.LABELED,
    buttonStyle:
      layout && buttonValues.includes(layout.buttonStyle)
        ? layout.buttonStyle
        : StoreFrontThemeButtonVariant.SOLID,
    iconStyle:
      layout && iconStyleValues.includes(layout.iconStyle)
        ? layout.iconStyle
        : StoreFrontThemeIconStyle.OUTLINE,
  };
}
