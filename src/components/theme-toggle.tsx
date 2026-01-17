'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Theme } from '@/types/enums';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations('theme');
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <div className="relative h-5 w-5">
          <Sun className="h-5 w-5" />
        </div>
        <span className="sr-only">{t('toggleTheme')}</span>
      </Button>
    );
  }

  const toggleTheme = () => {
    const currentTheme = resolvedTheme || theme;
    const newTheme = currentTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
  };

  const isLight = resolvedTheme === Theme.LIGHT || theme === Theme.LIGHT;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={t('toggleTheme')}
      className="relative"
    >
      <div className="relative h-5 w-5">
        {isLight ? (
          <Sun className="h-5 w-5 transition-transform" />
        ) : (
          <Moon className="h-5 w-5 transition-transform" />
        )}
      </div>
      <span className="sr-only">{t('toggleTheme')}</span>
    </Button>
  );
}
