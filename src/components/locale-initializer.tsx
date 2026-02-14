"use client";

import { setApiLocale } from "@/lib/api/types";
import { isValidLocale, Locale } from "@/types/enums";
import { useLocale } from "next-intl";
import { useEffect } from "react";

/**
 * Component that initializes the API locale for Accept-Language header.
 *
 * Sets the locale EAGERLY during render (not just in useEffect) so that
 * any client-side API call — even one fired in the very first useEffect
 * batch — sends the correct Accept-Language header instead of the default "en".
 *
 * Note: Store ID is now handled by StoreProvider
 */
export function LocaleInitializer() {
  const localeString = useLocale();
  const locale = isValidLocale(localeString) ? localeString : Locale.ENGLISH;

  // Set locale eagerly during render so it's available immediately.
  // This is safe because setApiLocale only writes to a module-level variable
  // (no React state, no side-effects that affect render output).
  if (typeof window !== "undefined") {
    setApiLocale(locale);
  }

  // Also keep the useEffect for locale changes after initial mount
  useEffect(() => {
    setApiLocale(locale);
  }, [locale]);

  return null;
}
