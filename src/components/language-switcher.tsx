'use client';

import {
    getAlternateLocale,
    localeMetadata,
} from '@/lib/i18n/locale-metadata';
import { applyLocaleChange, cn } from '@/lib/utils';
import { isValidLocale, Locale } from '@/types/enums';
import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

/**
 * Language switcher for the storefront header.
 *
 * Matches the marketing site pattern: one click switches to the other
 * language and the button label shows the target language native name
 * (e.g. "العربية" while browsing in English).
 */
export function LanguageSwitcher() {
  const t = useTranslations('language');
  const localeString = useLocale();
  const locale = isValidLocale(localeString) ? localeString : Locale.ARABIC;
  const [isPending, startTransition] = useTransition();

  const targetLocale = getAlternateLocale(locale);
  const targetMeta = localeMetadata[targetLocale];

  const handleSwitch = (): void => {
    startTransition(() => {
      applyLocaleChange(targetLocale);
    });
  };

  return (
    <button
      type="button"
      onClick={handleSwitch}
      disabled={isPending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium',
        'text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
      aria-label={t('switchTo', { language: targetMeta.nativeName })}
    >
      <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
      <span>{targetMeta.nativeName}</span>
    </button>
  );
}
