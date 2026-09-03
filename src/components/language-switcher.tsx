'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { applyLocaleChange } from '@/lib/utils';
import { Button } from './ui/button';
import { Locale } from '@/types/enums';

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

  const toggleLocale = () => {
    const newLocale = locale === Locale.ENGLISH ? Locale.ARABIC : Locale.ENGLISH;
    startTransition(() => {
      applyLocaleChange(newLocale);
    });
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
