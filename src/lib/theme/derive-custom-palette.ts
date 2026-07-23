import {
    StoreFrontThemeTokens,
    StoreFrontThemeTokenSet,
} from "@/features/store/types/store.types";

/**
 * Derive a full, contrast-safe light + dark palette from ONE merchant brand
 * color. Used to render `?preview_custom=` drafts; the tenant portal ships
 * the same derivation to compute the tokens it saves, so preview and saved
 * output stay identical.
 *
 * CONTRACT: keep in sync with the portal copy
 * (tenant-portal/src/utils/derive-custom-palette.ts). The saved artifact is
 * always the full token map, so drift would only ever affect previews.
 *
 * Derivation rules (HSL, hue taken from the seed):
 * - light mode sits on white with very light tints of the brand hue
 * - dark mode sits on a near-black brand-tinted surface, primary lightened
 *   to at least 62 lightness for contrast
 * - primaryForeground flips white/dark by the seed's relative luminance
 * - destructive stays the platform red (never derived)
 */
export function deriveCustomPalette(primaryHex: string): StoreFrontThemeTokens {
  const seed = normalizeHex(primaryHex);
  const { h, s, l } = hexToHsl(seed);

  const tint = (maxSaturation: number, lightness: number): string =>
    hslToHex(h, Math.min(s, maxSaturation), lightness);

  const lightForeground = tint(30, 12);
  const primaryLight = seed;
  const primaryLightForeground =
    relativeLuminance(primaryLight) > 0.42 ? tint(35, 10) : "#ffffff";

  const darkForeground = tint(20, 95);
  const primaryDark = hslToHex(h, s, Math.max(l, 62));
  const primaryDarkForeground =
    relativeLuminance(primaryDark) > 0.42 ? tint(35, 10) : "#ffffff";

  const light: StoreFrontThemeTokenSet = {
    background: "#ffffff",
    foreground: lightForeground,
    card: "#ffffff",
    cardForeground: lightForeground,
    popover: "#ffffff",
    popoverForeground: lightForeground,
    primary: primaryLight,
    primaryForeground: primaryLightForeground,
    secondary: tint(40, 96),
    secondaryForeground: tint(35, 20),
    muted: tint(30, 96),
    mutedForeground: tint(25, 42),
    accent: tint(45, 93),
    accentForeground: tint(35, 20),
    destructive: "#dc2626",
    destructiveForeground: "#ffffff",
    border: tint(30, 90),
    input: tint(30, 90),
    ring: primaryLight,
  };

  const dark: StoreFrontThemeTokenSet = {
    background: tint(35, 7),
    foreground: darkForeground,
    card: tint(30, 10),
    cardForeground: darkForeground,
    popover: tint(30, 10),
    popoverForeground: darkForeground,
    primary: primaryDark,
    primaryForeground: primaryDarkForeground,
    secondary: tint(30, 16),
    secondaryForeground: darkForeground,
    muted: tint(30, 16),
    mutedForeground: tint(20, 65),
    accent: tint(30, 20),
    accentForeground: darkForeground,
    destructive: "#b91c1c",
    destructiveForeground: "#ffffff",
    border: tint(30, 18),
    input: tint(30, 18),
    ring: primaryDark,
  };

  return { light, dark };
}

/** Accepts "aabbcc" or "#aabbcc" (any case) and returns "#aabbcc". */
function normalizeHex(hex: string): string {
  const bare = hex.startsWith("#") ? hex.slice(1) : hex;
  return `#${bare.toLowerCase()}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) {
    h = ((g - b) / delta) % 6;
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) {
    h += 360;
  }

  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const saturation = s / 100;
  const lightness = l / 100;

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - chroma / 2;

  const [r, g, b]: [number, number, number] =
    h < 60
      ? [chroma, x, 0]
      : h < 120
        ? [x, chroma, 0]
        : h < 180
          ? [0, chroma, x]
          : h < 240
            ? [0, x, chroma]
            : h < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];

  const toChannel = (value: number): string =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toChannel(r)}${toChannel(g)}${toChannel(b)}`;
}

/** WCAG relative luminance (0 = black, 1 = white). */
function relativeLuminance(hex: string): number {
  const channel = (raw: number): number => {
    const value = raw / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
