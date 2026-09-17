import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  StoreFrontFontPreset,
  StoreFrontRadiusPreset,
  StoreFrontStatus,
  type StoreFrontDto,
  type StoreFrontPaletteDto,
  type StoreFrontThemeDto,
} from "@/features/store/types/store.types";
import { buildThemeStyle } from "@/lib/theme/build-theme-style";
import { deriveCustomPalette } from "@/lib/theme/derive-custom-palette";
import { resolveStoreTheme } from "@/lib/theme/resolve-theme";
import {
  parseThemePreviewHeader,
  parseThemePreviewParams,
  serializeThemePreview,
} from "@/lib/theme/theme-preview";
import {
  sanitizeThemeLayout,
  sanitizeTokenSet,
} from "@/lib/theme/theme-validation";

const THEME_ID = "00000000-0000-4000-8000-000000000001";
const PALETTE_ID = "00000000-0000-4000-8000-000000000002";
const date = new Date("2026-01-01T00:00:00Z");
const palette: StoreFrontPaletteDto = {
  id: PALETTE_ID,
  key: "BRAND",
  nameEn: "Brand",
  nameAr: "العلامة",
  tokens: deriveCustomPalette("#2563eb"),
  displayOrder: 0,
  isActive: true,
  createdAt: date,
  updatedAt: date,
};
const theme: StoreFrontThemeDto = {
  id: THEME_ID,
  key: "BOUTIQUE",
  nameEn: "Boutique",
  nameAr: "بوتيك",
  descriptionEn: null,
  descriptionAr: null,
  defaultPaletteId: PALETTE_ID,
  defaultPalette: palette,
  layout: sanitizeThemeLayout(null),
  fontPreset: StoreFrontFontPreset.ELEGANT,
  radiusPreset: StoreFrontRadiusPreset.SHARP,
  displayOrder: 0,
  isActive: true,
  createdAt: date,
  updatedAt: date,
};
const storeFront: StoreFrontDto = {
  id: "storefront",
  storeId: "store",
  tenantId: "tenant",
  subdomain: "fixture",
  logoUrl: null,
  themeId: THEME_ID,
  theme,
  paletteId: null,
  customTokens: deriveCustomPalette("#008080"),
  fontPreset: StoreFrontFontPreset.MODERN,
  radiusPreset: StoreFrontRadiusPreset.PILL,
  hideOutOfStock: false,
  status: StoreFrontStatus.ACTIVE,
  createdAt: date,
  updatedAt: date,
};

const draftParams = (extra = ""): URLSearchParams =>
  new URLSearchParams(`preview_draft=1&preview_theme=${THEME_ID}&${extra}`);

describe("validated preview contract", () => {
  it("keeps an all-default draft distinct from a regular visitor", () => {
    assert.equal(parseThemePreviewParams(new URLSearchParams()), null);
    assert.deepEqual(
      parseThemePreviewParams(new URLSearchParams("preview_draft=1")),
      {
        isDraft: true,
        themeId: null,
        paletteId: null,
        customPrimaryHex: null,
        fontPreset: null,
        radiusPreset: null,
      },
    );
  });

  it("round-trips explicit DEFAULT selections and custom colors", () => {
    const preview = parseThemePreviewParams(
      draftParams(
        "preview_font=DEFAULT&preview_radius=DEFAULT&preview_custom=ABCDEF",
      ),
    );
    assert.equal(preview?.fontPreset, StoreFrontFontPreset.DEFAULT);
    assert.equal(preview?.radiusPreset, StoreFrontRadiusPreset.DEFAULT);
    assert.deepEqual(
      parseThemePreviewHeader(serializeThemePreview(preview)),
      preview,
    );
  });

  it("keeps legacy partial previews supported", () => {
    const preview = parseThemePreviewParams(
      new URLSearchParams("preview_font=FRIENDLY"),
    );
    assert.equal(preview?.isDraft, false);
    assert.equal(preview?.fontPreset, StoreFrontFontPreset.FRIENDLY);
  });

  it("drops invalid IDs, colors and enums", () => {
    assert.equal(
      parseThemePreviewParams(
        new URLSearchParams(
          "preview_theme=bad&preview_palette=bad&preview_custom=red&preview_font=evil&preview_radius=huge",
        ),
      ),
      null,
    );
    assert.equal(
      parseThemePreviewParams(new URLSearchParams("preview_draft=true")),
      null,
    );
  });

  for (const raw of [
    "{",
    "null",
    "[]",
    "1",
    '"string"',
    "{}",
    '{"d":"true"}',
    '{"t":{"id":"bad"},"c":["abcdef"],"f":1}',
  ]) {
    it(`rejects malformed header ${raw}`, () =>
      assert.equal(parseThemePreviewHeader(raw), null));
  }
});

describe("draft and saved appearance", () => {
  it("does not change the saved appearance for normal visits", () => {
    const resolved = resolveStoreTheme(storeFront, null, null, null, null);
    assert.equal(resolved.fontPreset, StoreFrontFontPreset.MODERN);
    assert.equal(resolved.radiusRem, "1rem");
    assert.equal(
      resolved.tokens?.light.primary,
      storeFront.customTokens?.light.primary,
    );
  });

  it("uses theme font/radius rather than saved overrides when DEFAULT is selected", () => {
    const preview = parseThemePreviewParams(
      draftParams("preview_font=DEFAULT&preview_radius=DEFAULT"),
    );
    const resolved = resolveStoreTheme(storeFront, theme, null, null, preview);
    assert.equal(resolved.fontPreset, StoreFrontFontPreset.ELEGANT);
    assert.equal(resolved.radiusRem, "0.25rem");
    assert.equal(resolved.tokens?.light.primary, palette.tokens.light.primary);
  });

  it("treats missing draft style values as defaults, not saved customizations", () => {
    const resolved = resolveStoreTheme(
      storeFront,
      theme,
      null,
      null,
      parseThemePreviewParams(draftParams()),
    );
    assert.equal(resolved.fontPreset, theme.fontPreset);
    assert.equal(resolved.radiusRem, "0.25rem");
  });

  it("clears every saved customization in an all-default reset draft", () => {
    const before = structuredClone(storeFront);
    const resolved = resolveStoreTheme(
      storeFront,
      null,
      null,
      null,
      parseThemePreviewParams(
        new URLSearchParams(
          "preview_draft=1&preview_font=DEFAULT&preview_radius=DEFAULT",
        ),
      ),
    );
    assert.equal(resolved.themeKey, null);
    assert.equal(resolved.tokens, null);
    assert.equal(resolved.fontPreset, StoreFrontFontPreset.CLASSIC);
    assert.equal(resolved.radiusRem, null);
    assert.equal(buildThemeStyle(resolved), null);
    assert.deepEqual(storeFront, before);
  });

  it("honors a locked palette with a design preview", () => {
    const locked = { ...palette, tokens: deriveCustomPalette("#a04000") };
    const resolved = resolveStoreTheme(
      storeFront,
      theme,
      locked,
      null,
      parseThemePreviewParams(draftParams(`preview_palette=${PALETTE_ID}`)),
    );
    assert.equal(resolved.tokens?.light.primary, locked.tokens.light.primary);
  });

  it("honors custom draft colors without mutating stored tokens", () => {
    const custom = deriveCustomPalette("#808080");
    const resolved = resolveStoreTheme(
      storeFront,
      theme,
      null,
      custom,
      parseThemePreviewParams(draftParams("preview_custom=808080")),
    );
    assert.deepEqual(resolved.tokens, custom);
    assert.notEqual(
      storeFront.customTokens?.light.primary,
      custom.light.primary,
    );
  });

  it("an explicit legacy font DEFAULT clears only that saved override", () => {
    const resolved = resolveStoreTheme(
      storeFront,
      null,
      null,
      null,
      parseThemePreviewParams(new URLSearchParams("preview_font=DEFAULT")),
    );
    assert.equal(resolved.fontPreset, theme.fontPreset);
    assert.equal(resolved.radiusRem, "1rem");
  });

  it("validates every color before CSS serialization", () => {
    const safe = sanitizeTokenSet({
      ...palette.tokens.light,
      primary: "</style><script>alert(1)</script>",
      foreground: "#ABCDEF",
    });
    assert.equal(safe.primary, undefined);
    assert.equal(safe.foreground, "#abcdef");
    const resolved = resolveStoreTheme(storeFront, null, palette, null, null);
    const css = buildThemeStyle(resolved);
    assert.ok(css?.includes(":root"));
    assert.ok(css?.includes(".dark"));
    assert.ok(css?.includes("--radius: 1rem"));
  });
});
