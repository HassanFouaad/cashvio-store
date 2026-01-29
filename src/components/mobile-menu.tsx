'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Drawer } from 'vaul';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';

interface MobileMenuProps {
  storeCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ storeCode, isOpen, onClose }: MobileMenuProps) {
  const t = useTranslations();

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[80vh] mt-24 fixed bottom-0 left-0 right-0 z-50 overflow-hidden">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-4" />
          
          <div className="flex items-center justify-between p-4 border-b">
            <Drawer.Title className="text-lg font-semibold">
              {t('common.menu')}
            </Drawer.Title>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t('common.close')}</span>
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1 mb-6">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
              >
                {t('common.home')}
              </Link>
              <Link
                href="/categories"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
              >
                {t('common.collections')}
              </Link>
              <Link
                href="/products"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg hover:bg-muted transition-colors"
              >
                {t('common.products')}
              </Link>
            </div>

            {/* Mobile-only settings */}
            <div className="border-t pt-4">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('common.settings')}
              </p>
              <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-lg mx-2">
                <span className="text-sm font-medium">{t('theme.toggleTheme')}</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-lg mx-2">
                <span className="text-sm font-medium">{t('language.changeLanguage')}</span>
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
