'use client';

import * as React from 'react';
import { Globe, Moon, Sun, X, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { Drawer } from 'vaul';
import { applyLocaleChange } from '@/lib/utils';
import { Button } from './ui/button';
import { Locale, Theme } from '@/types/enums';

interface MobileSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile Settings Sheet for Store-front
 *
 * Manages store-specific locale and theme settings.
 * Locale cookie is intentionally store-specific (no cross-domain).
 */
export function MobileSettingsSheet({ isOpen, onClose }: MobileSettingsSheetProps) {
  const t = useTranslations();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const locale = useLocale();
  const [mounted, setMounted] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const currentTheme = resolvedTheme || theme;
    const newTheme = currentTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
  };

  const toggleLocale = () => {
    startTransition(() => {
      const newLocale = locale === Locale.ENGLISH ? Locale.ARABIC : Locale.ENGLISH;
      applyLocaleChange(newLocale);
    });
  };

  const isLight = mounted && (resolvedTheme === Theme.LIGHT || theme === Theme.LIGHT);
  const currentLanguage = locale === Locale.ENGLISH ? t('language.english') : t('language.arabic');

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 z-50 overflow-hidden">
          {/* Drawer Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-4" />
          
          {/* Header */}
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

          {/* Settings Content */}
          <div
            className="px-4 pt-2 divide-y divide-border"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Theme Setting - Fully Clickable Row */}
            <button
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
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rtl:rotate-180" />
            </button>

            {/* Language Setting - Fully Clickable Row */}
            <button
              onClick={toggleLocale}
              disabled={isPending}
              className="w-full flex items-center gap-4 py-3.5 active:opacity-60 transition-opacity text-start disabled:opacity-50"
            >
              <Globe
                className="h-5 w-5 text-muted-foreground shrink-0"
                strokeWidth={1.5}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t('language.changeLanguage')}</p>
                <p className="text-xs text-muted-foreground">{currentLanguage}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rtl:rotate-180" />
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
