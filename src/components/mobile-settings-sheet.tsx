'use client';

import { localeMetadata } from '@/lib/i18n/locale-metadata';
import { applyLocaleChange, cn } from '@/lib/utils';
import { getAllLocales, isValidLocale, Locale, Theme } from '@/types/enums';
import { Check, Globe, Moon, Sun, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { Drawer } from 'vaul';
import { Button } from './ui/button';

interface MobileSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile settings sheet for the storefront.
 *
 * Theme toggles inline; language uses an explicit picker (English / Arabic)
 * like the tenant portal, not a blind toggle.
 */
export function MobileSettingsSheet({ isOpen, onClose }: MobileSettingsSheetProps) {
  const t = useTranslations();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const localeString = useLocale();
  const locale = isValidLocale(localeString) ? localeString : Locale.ARABIC;
  const [mounted, setMounted] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = (): void => {
    const currentTheme = resolvedTheme || theme;
    const newTheme = currentTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
  };

  const handleLocaleSelect = (newLocale: Locale): void => {
    if (newLocale === locale || isPending) {
      return;
    }

    startTransition(() => {
      applyLocaleChange(newLocale);
    });
  };

  const isLight = mounted && (resolvedTheme === Theme.LIGHT || theme === Theme.LIGHT);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 z-50 overflow-hidden">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-4" />

          <div className="flex items-center justify-between p-4 border-b">
            <Drawer.Title className="text-lg font-semibold">
              {t('common.settings')}
            </Drawer.Title>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full min-h-0 min-w-0"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t('common.close')}</span>
            </Button>
          </div>

          <div
            className="px-4 pt-2 divide-y divide-border"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center gap-4 py-3.5 active:opacity-60 transition-opacity text-start"
            >
              {mounted && isLight ? (
                <Sun
                  className="h-5 w-5 text-muted-foreground shrink-0"
                  strokeWidth={1.5}
                />
              ) : (
                <Moon
                  className="h-5 w-5 text-muted-foreground shrink-0"
                  strokeWidth={1.5}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t('theme.toggleTheme')}</p>
                <p className="text-xs text-muted-foreground">
                  {mounted ? (isLight ? t('theme.light') : t('theme.dark')) : '...'}
                </p>
              </div>
            </button>

            <div className="py-3.5">
              <div className="flex items-center gap-4 mb-3">
                <Globe
                  className="h-5 w-5 text-muted-foreground shrink-0"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-medium">{t('language.selectLanguage')}</p>
              </div>

              <div className="grid grid-cols-1 gap-1 ps-9">
                {getAllLocales().map((option) => {
                  const isSelected = option === locale;
                  const label =
                    option === Locale.ENGLISH
                      ? localeMetadata[Locale.ENGLISH].nativeName
                      : localeMetadata[Locale.ARABIC].nativeName;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleLocaleSelect(option)}
                      disabled={isPending}
                      aria-current={isSelected ? 'true' : undefined}
                      className={cn(
                        'flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-start',
                        'transition-colors active:opacity-60 disabled:opacity-50',
                        isSelected
                          ? 'bg-accent text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                    >
                      <span>{label}</span>
                      {isSelected ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
