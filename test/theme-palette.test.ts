import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveCustomPalette } from "@/lib/theme/derive-custom-palette";
import { THEME_TOKEN_KEYS } from "@/lib/theme/theme-constants";
import type { StoreFrontThemeTokenSet } from "@/features/store/types/store.types";

const textPairs: [
  keyof StoreFrontThemeTokenSet,
  keyof StoreFrontThemeTokenSet,
][] = [
  ["background", "foreground"],
  ["card", "cardForeground"],
  ["popover", "popoverForeground"],
  ["primary", "primaryForeground"],
  ["secondary", "secondaryForeground"],
  ["muted", "mutedForeground"],
  ["accent", "accentForeground"],
  ["destructive", "destructiveForeground"],
  ["background", "mutedForeground"],
  ["card", "mutedForeground"],
  ["accent", "mutedForeground"],
];

function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

describe("custom palette readability", () => {
  it("preserves the brand seed and returns exactly 19 hex tokens per mode", () => {
    const palette = deriveCustomPalette("AABBCC");
    assert.equal(palette.light.primary, "#aabbcc");
    for (const mode of [palette.light, palette.dark]) {
      assert.deepEqual(Object.keys(mode).sort(), [...THEME_TOKEN_KEYS].sort());
      assert.ok(
        Object.values(mode).every((value) => /^#[0-9a-f]{6}$/.test(value)),
      );
    }
  });

  it("meets 4.5:1 for text pairs across 4,096 seeds in both modes", () => {
    for (let red = 0; red <= 255; red += 17) {
      for (let green = 0; green <= 255; green += 17) {
        for (let blue = 0; blue <= 255; blue += 17) {
          const seed = `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
          const palette = deriveCustomPalette(seed);
          for (const mode of ["light", "dark"] as const) {
            for (const [background, foreground] of textPairs) {
              const ratio = contrast(
                palette[mode][background],
                palette[mode][foreground],
              );
              assert.ok(
                ratio >= 4.5,
                `${seed} ${mode} ${background}/${foreground}: ${ratio.toFixed(3)}`,
              );
            }
          }
        }
      }
    }
  });
});
