import {
  StoreFrontFontPreset,
  StoreFrontRadiusPreset,
} from "@/features/store/types/store.types";
import {
  THEME_PREVIEW_CUSTOM_PARAM,
  THEME_PREVIEW_DRAFT_PARAM,
  THEME_PREVIEW_FONT_PARAM,
  THEME_PREVIEW_PALETTE_PARAM,
  THEME_PREVIEW_RADIUS_PARAM,
  THEME_PREVIEW_THEME_PARAM,
} from "@/lib/constants";

import type { ThemePreviewOverrides } from "./resolve-theme";
import {
  THEME_PREVIEW_CUSTOM_HEX_REGEX,
  THEME_PREVIEW_UUID_REGEX,
} from "./theme-constants";

interface ThemePreviewHeader {
  d?: boolean;
  t?: string | null;
  p?: string | null;
  c?: string | null;
  f?: string | null;
  r?: string | null;
}

/** Both URL and header input use the same cosmetic-only allowlists. */
function validatePreview(
  input: ThemePreviewHeader | null,
): ThemePreviewOverrides | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const isDraft = input.d === true;
  const themeId =
    typeof input.t === "string" && THEME_PREVIEW_UUID_REGEX.test(input.t)
      ? input.t
      : null;
  const paletteId =
    typeof input.p === "string" && THEME_PREVIEW_UUID_REGEX.test(input.p)
      ? input.p
      : null;
  const customPrimaryHex =
    typeof input.c === "string" && THEME_PREVIEW_CUSTOM_HEX_REGEX.test(input.c)
      ? input.c
      : null;
  const fontPreset =
    Object.values(StoreFrontFontPreset).find((value) => value === input.f) ??
    null;
  const radiusPreset =
    Object.values(StoreFrontRadiusPreset).find((value) => value === input.r) ??
    null;

  if (
    !isDraft &&
    !themeId &&
    !paletteId &&
    !customPrimaryHex &&
    !fontPreset &&
    !radiusPreset
  ) {
    return null;
  }

  return {
    isDraft,
    themeId,
    paletteId,
    customPrimaryHex,
    fontPreset,
    radiusPreset,
  };
}

export function parseThemePreviewParams(
  params: URLSearchParams,
): ThemePreviewOverrides | null {
  return validatePreview({
    d: params.get(THEME_PREVIEW_DRAFT_PARAM) === "1",
    t: params.get(THEME_PREVIEW_THEME_PARAM),
    p: params.get(THEME_PREVIEW_PALETTE_PARAM),
    c: params.get(THEME_PREVIEW_CUSTOM_PARAM),
    f: params.get(THEME_PREVIEW_FONT_PARAM),
    r: params.get(THEME_PREVIEW_RADIUS_PARAM),
  });
}

export function serializeThemePreview(
  preview: ThemePreviewOverrides | null,
): string | null {
  if (!preview) return null;
  return JSON.stringify({
    d: preview.isDraft,
    t: preview.themeId,
    p: preview.paletteId,
    c: preview.customPrimaryHex,
    f: preview.fontPreset,
    r: preview.radiusPreset,
  } satisfies ThemePreviewHeader);
}

export function parseThemePreviewHeader(
  raw: string | null,
): ThemePreviewOverrides | null {
  if (!raw) return null;
  try {
    // The assertion describes the wire shape, not trust: every field and
    // the container itself are validated before any value reaches CSS.
    return validatePreview(JSON.parse(raw) as ThemePreviewHeader | null);
  } catch {
    return null;
  }
}
