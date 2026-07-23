import {
    StoreFrontDto,
    StoreFrontFontPreset,
    StoreFrontPaletteDto,
    StoreFrontRadiusPreset,
    StoreFrontThemeDto,
    StoreFrontThemeLayout,
    StoreFrontThemeTokens,
} from "@/features/store/types/store.types";
import { RADIUS_PRESET_REM } from "./theme-constants";
import {
    SafeThemeTokenSet,
    sanitizeThemeLayout,
    sanitizeTokenSet,
} from "./theme-validation";

/** Draft overrides carried by the preview header (already enum-validated) */
export interface ThemePreviewOverrides {
  themeId: string | null;
  paletteId: string | null;
  /** Bare 6-digit hex seed of a draft custom palette */
  customPrimaryHex: string | null;
  fontPreset: StoreFrontFontPreset | null;
  radiusPreset: StoreFrontRadiusPreset | null;
}

/**
 * The fully resolved appearance of the current request. Everything the
 * rendering layer needs: validated CSS tokens, a concrete font pairing,
 * a radius override (null = keep the globals.css default), and the
 * layout-variant map for structural theming.
 */
export interface ResolvedStoreTheme {
  tokens: { light: SafeThemeTokenSet; dark: SafeThemeTokenSet } | null;
  fontPreset: StoreFrontFontPreset;
  radiusRem: string | null;
  layout: StoreFrontThemeLayout;
}

/**
 * Merge order (later wins):
 * 1. globals.css defaults (represented by null/absent values here)
 * 2. the assigned theme design (layout + typography/radius defaults)
 * 3. colors: merchant custom palette or catalog palette (mutually
 *    exclusive, server-enforced), else the design's default palette
 * 4. the merchant's font/radius customizations
 * 5. validated preview overrides (draft state from the portal builder)
 */
export function resolveStoreTheme(
  storeFront: StoreFrontDto | null | undefined,
  previewTheme: StoreFrontThemeDto | null,
  previewPalette: StoreFrontPaletteDto | null,
  previewCustomTokens: StoreFrontThemeTokens | null,
  previewOverrides: ThemePreviewOverrides | null,
): ResolvedStoreTheme {
  const theme = previewTheme ?? storeFront?.theme ?? null;

  // Color source precedence. An explicit preview choice (custom seed or
  // catalog palette) always wins. When a design is being previewed WITHOUT
  // an explicit color choice, show its designed default (the merchant's
  // saved colors must not bleed into a different design preview — that is
  // exactly what saving with "theme colors" produces).
  const tokensSource: StoreFrontThemeTokens | null = previewCustomTokens
    ? previewCustomTokens
    : previewPalette
      ? previewPalette.tokens
      : previewTheme
        ? (previewTheme.defaultPalette?.tokens ?? null)
        : (storeFront?.palette?.tokens ??
          storeFront?.customTokens ??
          theme?.defaultPalette?.tokens ??
          null);

  const tokens = tokensSource
    ? {
        light: sanitizeTokenSet(tokensSource.light),
        dark: sanitizeTokenSet(tokensSource.dark),
      }
    : null;

  const fontPreset = resolvePreset(
    previewOverrides?.fontPreset,
    storeFront?.fontPreset,
    theme?.fontPreset,
    StoreFrontFontPreset.DEFAULT,
    StoreFrontFontPreset.CLASSIC,
  );

  const radiusPreset = resolvePreset(
    previewOverrides?.radiusPreset,
    storeFront?.radiusPreset,
    theme?.radiusPreset,
    StoreFrontRadiusPreset.DEFAULT,
    StoreFrontRadiusPreset.SOFT,
  );

  // SOFT is the globals.css default — no override needed
  const radiusRem =
    radiusPreset === StoreFrontRadiusPreset.SOFT
      ? null
      : (RADIUS_PRESET_REM[radiusPreset] ?? null);

  return {
    tokens,
    fontPreset,
    radiusRem,
    layout: sanitizeThemeLayout(theme?.layout),
  };
}

/**
 * Pick the first concrete (non-DEFAULT) value along the chain
 * preview -> merchant setting -> theme default -> fallback.
 */
function resolvePreset<T extends string>(
  previewValue: T | null | undefined,
  merchantValue: T | null | undefined,
  themeValue: T | null | undefined,
  defaultMarker: T,
  fallback: T,
): Exclude<T, typeof defaultMarker> {
  for (const value of [previewValue, merchantValue, themeValue]) {
    if (value && value !== defaultMarker) {
      return value as Exclude<T, typeof defaultMarker>;
    }
  }
  return fallback as Exclude<T, typeof defaultMarker>;
}
