import { headers } from "next/headers";
import { cache } from "react";

import { getStoreFrontPalettes } from "@/features/store/api/get-palettes";
import { getStoreFrontThemes } from "@/features/store/api/get-themes";
import type {
  StoreFrontDto,
  StoreFrontPaletteDto,
  StoreFrontThemeDto,
} from "@/features/store/types/store.types";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { THEME_PREVIEW_HEADER } from "@/lib/constants";

import { deriveCustomPalette } from "./derive-custom-palette";
import { resolveStoreTheme, type ResolvedStoreTheme } from "./resolve-theme";
import { parseThemePreviewHeader } from "./theme-preview";

/** Resolve once per request, shared by the layout and page components. */
export const resolveRequestTheme = cache(
  async (): Promise<ResolvedStoreTheme> => {
    const { store } = await resolveRequestStore();
    const preview = parseThemePreviewHeader(
      (await headers()).get(THEME_PREVIEW_HEADER),
    );

    // Independent catalog lookups must not add two network round trips to
    // every preview. Reuse assigned payloads whenever they already match.
    const [previewTheme, previewPalette] = await Promise.all([
      resolvePreviewTheme(store?.storeFront, preview?.themeId),
      resolvePreviewPalette(store?.storeFront, preview?.paletteId),
    ]);
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

async function resolvePreviewTheme(
  storeFront: StoreFrontDto | null | undefined,
  themeId: string | null | undefined,
): Promise<StoreFrontThemeDto | null> {
  if (!themeId) return null;
  if (themeId === storeFront?.themeId && storeFront.theme) {
    return storeFront.theme;
  }
  const themes = await getStoreFrontThemes();
  return themes.find((theme) => theme.id === themeId) ?? null;
}

async function resolvePreviewPalette(
  storeFront: StoreFrontDto | null | undefined,
  paletteId: string | null | undefined,
): Promise<StoreFrontPaletteDto | null> {
  if (!paletteId) return null;
  if (paletteId === storeFront?.paletteId && storeFront.palette) {
    return storeFront.palette;
  }
  const palettes = await getStoreFrontPalettes();
  return palettes.find((palette) => palette.id === paletteId) ?? null;
}
