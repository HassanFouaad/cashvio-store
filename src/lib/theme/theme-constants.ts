import {
    StoreFrontRadiusPreset,
    StoreFrontThemeTokenSet,
} from "@/features/store/types/store.types";

/**
 * The 19 design tokens a theme controls. Order matches globals.css.
 * Every key maps to the CSS custom property `--color-{kebab-case(key)}`.
 */
export const THEME_TOKEN_KEYS = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "destructiveForeground",
  "border",
  "input",
  "ring",
] as const satisfies readonly (keyof StoreFrontThemeTokenSet)[];

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];

/**
 * Theme token values are strictly 6-digit hex (stricter than the legacy
 * brand-color regex): DB data is treated as untrusted at render time and
 * anything else is dropped per-key.
 */
export const THEME_HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Radius presets in rem. SOFT is the storefront's current default
 * (--radius: 0.5rem in globals.css) — resolving to SOFT emits no override.
 */
export const RADIUS_PRESET_REM: Record<
  Exclude<StoreFrontRadiusPreset, StoreFrontRadiusPreset.DEFAULT>,
  string
> = {
  [StoreFrontRadiusPreset.SHARP]: "0.25rem",
  [StoreFrontRadiusPreset.SOFT]: "0.5rem",
  [StoreFrontRadiusPreset.ROUNDED]: "0.75rem",
  [StoreFrontRadiusPreset.PILL]: "1rem",
};

/** UUID shape accepted for the theme preview query param */
export const THEME_PREVIEW_UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Bare 6-digit hex (no #) accepted for the custom-color preview param */
export const THEME_PREVIEW_CUSTOM_HEX_REGEX = /^[0-9a-fA-F]{6}$/;
