import {
  Almarai,
  Amiri,
  Cairo,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  Inter,
  Nunito,
  Playfair_Display,
  Poppins,
  Rubik,
  Tajawal,
} from "next/font/google";

import { StoreFrontFontPreset } from "@/features/store/types/store.types";
import { FontFamily, Locale } from "@/types/enums";

/**
 * Theme font pairings.
 *
 * Inter + Cairo (the CLASSIC pairing) keep their original settings from the
 * root layout — preloaded, exposed as CSS variables consumed by the
 * `font-sans` / `font-cairo` Tailwind families — so default stores render
 * byte-identical to before the theme engine.
 *
 * Every other family loads with `preload: false`: next/font emits the
 * @font-face CSS, but the browser only downloads a font file when the
 * family is actually used by rendered text. Stores that don't use a
 * pairing never pay for it.
 */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const rubik = Rubik({
  subsets: ["latin", "arabic"],
  display: "swap",
  preload: false,
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const almarai = Almarai({
  weight: ["300", "400", "700", "800"],
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const tajawal = Tajawal({
  weight: ["400", "500", "700"],
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

/** Class names the body must carry for the resolved font setup */
export interface ThemeFontClassNames {
  /** CSS-variable classes (always includes Inter + Cairo for token refs) */
  variables: string;
  /** The active font-family class for the current locale */
  family: string;
}

/**
 * Resolve the body font classes for a concrete (non-DEFAULT) font preset.
 * CLASSIC reproduces the pre-theme-engine behavior exactly.
 */
export function getThemeFontClassNames(
  fontPreset: StoreFrontFontPreset,
  locale: Locale,
): ThemeFontClassNames {
  const variables = `${inter.variable} ${cairo.variable}`;
  const isArabic = locale === Locale.ARABIC;

  switch (fontPreset) {
    case StoreFrontFontPreset.MODERN:
      return { variables, family: rubik.className };
    case StoreFrontFontPreset.TECHNICAL:
      return {
        variables,
        family: isArabic ? ibmPlexSansArabic.className : ibmPlexSans.className,
      };
    case StoreFrontFontPreset.ELEGANT:
      return {
        variables,
        family: isArabic ? amiri.className : playfairDisplay.className,
      };
    case StoreFrontFontPreset.FRIENDLY:
      return {
        variables,
        family: isArabic ? almarai.className : nunito.className,
      };
    case StoreFrontFontPreset.CLEAN:
      return {
        variables,
        family: isArabic ? tajawal.className : poppins.className,
      };
    case StoreFrontFontPreset.CLASSIC:
    case StoreFrontFontPreset.DEFAULT:
    default:
      return {
        variables,
        family: isArabic ? FontFamily.CAIRO : FontFamily.INTER,
      };
  }
}
