import { Direction, Locale } from "@/types/enums";

export interface LocaleMetadata {
  name: string;
  nativeName: string;
  direction: Direction;
}

export const localeMetadata: Record<Locale, LocaleMetadata> = {
  [Locale.ENGLISH]: {
    name: "English",
    nativeName: "English",
    direction: Direction.LTR,
  },
  [Locale.ARABIC]: {
    name: "Arabic",
    nativeName: "العربية",
    direction: Direction.RTL,
  },
};

export function getAlternateLocale(locale: Locale): Locale {
  return locale === Locale.ENGLISH ? Locale.ARABIC : Locale.ENGLISH;
}
