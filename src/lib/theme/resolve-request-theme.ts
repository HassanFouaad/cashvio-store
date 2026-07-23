import { getStoreFrontPalettes } from "@/features/store/api/get-palettes";
import { getStoreFrontThemes } from "@/features/store/api/get-themes";
import {
    StoreFrontFontPreset,
    StoreFrontPaletteDto,
    StoreFrontRadiusPreset,
    StoreFrontThemeDto,
} from "@/features/store/types/store.types";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { THEME_PREVIEW_HEADER } from "@/lib/constants";
import { headers } from "next/headers";
import { cache } from "react";
import { deriveCustomPalette } from "./derive-custom-palette";
import {
    ResolvedStoreTheme,
    resolveStoreTheme,
    ThemePreviewOverrides,
} from "./resolve-theme";
import {
    THEME_PREVIEW_CUSTOM_HEX_REGEX,
    THEME_PREVIEW_UUID_REGEX,
} from "./theme-constants";

/**
 * Resolve the effective theme for the current request:
 * assigned design + palette (nested in the store payload) + merchant
 * customizations, optionally overridden by validated preview params
 * forwarded by the middleware (the portal builder's draft state).
 *
 * Cached per request via React.cache() — callable from the layout and any
 * server component without duplicate work.
 */
export const resolveRequestTheme = cache(
  async (): Promise<ResolvedStoreTheme> => {
    const { store } = await resolveRequestStore();
    const preview = await readPreviewOverrides();

    // Resolve the previewed DESIGN. When it matches the assigned theme the
    // nested payload copy is reused (it carries the default palette too) —
    // this also makes "design + theme-default colors" preview correct even
    // when the merchant has a different palette saved.
    let previewTheme: StoreFrontThemeDto | null = null;
    if (preview?.themeId) {
      if (
        preview.themeId === store?.storeFront?.themeId &&
        store?.storeFront?.theme
      ) {
        previewTheme = store.storeFront.theme;
      } else {
        const themes = await getStoreFrontThemes();
        previewTheme =
          themes.find((theme) => theme.id === preview.themeId) ?? null;
      }
    }

    // Resolve the previewed PALETTE the same way — payload copy first,
    // catalog lookup only when previewing a different palette.
    let previewPalette: StoreFrontPaletteDto | null = null;
    if (preview?.paletteId) {
      if (
        preview.paletteId === store?.storeFront?.paletteId &&
        store?.storeFront?.palette
      ) {
        previewPalette = store.storeFront.palette;
      } else {
        const palettes = await getStoreFrontPalettes();
        previewPalette =
          palettes.find((palette) => palette.id === preview.paletteId) ?? null;
      }
    }

    // A draft custom color arrives as a bare hex seed — the full palette is
    // derived exactly like the portal derives the tokens it saves.
    const previewCustomTokens = preview?.customPrimaryHex
      ? deriveCustomPalette(preview.customPrimaryHex)
      : null;

    return resolveStoreTheme(
      store?.storeFront,
      previewTheme,
      previewPalette,
      previewCustomTokens,
      preview,
    );
  },
);

/**
 * Parse the middleware-forwarded preview header. The middleware already
 * validates, but the values are re-checked here (defense in depth — the
 * header shape is an internal contract, not a trust boundary).
 */
async function readPreviewOverrides(): Promise<ThemePreviewOverrides | null> {
  const headersList = await headers();
  const rawHeader = headersList.get(THEME_PREVIEW_HEADER);

  if (!rawHeader) {
    return null;
  }

  let parsed: { t?: string; p?: string; c?: string; f?: string; r?: string };
  try {
    parsed = JSON.parse(rawHeader) as {
      t?: string;
      p?: string;
      c?: string;
      f?: string;
      r?: string;
    };
  } catch {
    return null;
  }

  const fontValues = Object.values(StoreFrontFontPreset);
  const radiusValues = Object.values(StoreFrontRadiusPreset);

  const themeId =
    parsed.t && THEME_PREVIEW_UUID_REGEX.test(parsed.t) ? parsed.t : null;
  const paletteId =
    parsed.p && THEME_PREVIEW_UUID_REGEX.test(parsed.p) ? parsed.p : null;
  const customPrimaryHex =
    parsed.c && THEME_PREVIEW_CUSTOM_HEX_REGEX.test(parsed.c)
      ? parsed.c
      : null;
  const fontPreset = fontValues.includes(parsed.f as StoreFrontFontPreset)
    ? (parsed.f as StoreFrontFontPreset)
    : null;
  const radiusPreset = radiusValues.includes(
    parsed.r as StoreFrontRadiusPreset,
  )
    ? (parsed.r as StoreFrontRadiusPreset)
    : null;

  if (
    !themeId &&
    !paletteId &&
    !customPrimaryHex &&
    !fontPreset &&
    !radiusPreset
  ) {
    return null;
  }

  return { themeId, paletteId, customPrimaryHex, fontPreset, radiusPreset };
}
