import { StoreFrontThemeHeaderVariant } from "@/features/store/types/store.types";

/**
 * Class sets applied to homepage section headers, derived from the theme's
 * header variant so the whole page follows one structural language:
 * CLASSIC keeps the current start-aligned rows, CENTERED stacks and centers
 * titles, MINIMAL uses compact uppercase editorial labels.
 */
export interface SectionHeadingStyle {
  /** Wrapper around the title + "view all" link */
  wrapper: string;
  /** The h2 title itself */
  heading: string;
}

export function getSectionHeadingStyle(
  headerVariant: StoreFrontThemeHeaderVariant,
): SectionHeadingStyle {
  switch (headerVariant) {
    case StoreFrontThemeHeaderVariant.CENTERED:
      return {
        wrapper:
          "flex flex-col items-center gap-2 text-center mb-5 sm:mb-8",
        heading: "text-xl sm:text-2xl md:text-3xl font-bold",
      };
    case StoreFrontThemeHeaderVariant.MINIMAL:
      return {
        wrapper: "flex items-center justify-between mb-4 sm:mb-6",
        heading:
          "text-sm sm:text-base font-semibold uppercase tracking-[0.2em]",
      };
    case StoreFrontThemeHeaderVariant.CLASSIC:
    default:
      return {
        wrapper: "flex items-center justify-between mb-4 sm:mb-6",
        heading: "text-xl sm:text-2xl md:text-3xl font-bold",
      };
  }
}
