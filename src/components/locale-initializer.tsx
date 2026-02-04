'use client';

import { setApiLocale } from '@/lib/api/types';
import { isValidLocale, Locale } from '@/types/enums';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

/**
 * Component that initializes the API locale for Accept-Language header
 * This runs on mount and when locale changes
 * 
 * Note: Store ID is now handled by StoreProvider
 */
export function LocaleInitializer() {
  const localeString = useLocale();
  const locale = isValidLocale(localeString) ? localeString : Locale.ENGLISH;

  useEffect(() => {
    setApiLocale(locale);
  }, [locale]);

  return null;
}
