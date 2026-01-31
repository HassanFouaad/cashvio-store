'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Locale, CookieName } from '@/types/enums';

const COOKIE_MAX_AGE = 31536000; // 1 year

/**
 * Language Switcher for Store-front
 *
 * Sets store-specific locale cookie.
 * This is intentionally NOT a cross-domain cookie because
 * different stores may have different locale preferences.
 */
export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const changeLanguage = (newLocale: Locale) => {
    startTransition(() => {
      // Set store-specific locale cookie (no domain = current host only)
      document.cookie = `${CookieName.LOCALE}=${newLocale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
      // Reload to apply new locale
      window.location.reload();
    });
  };

  const toggleLocale = () => {
    const newLocale = locale === Locale.ENGLISH ? Locale.ARABIC : Locale.ENGLISH;
    changeLanguage(newLocale);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLocale}
      disabled={isPending}
      title={t('changeLanguage')}
    >
      <Globe className="h-5 w-5" />
      <span className="sr-only">{t('changeLanguage')}</span>
    </Button>
  );
}
